// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import {
  Radio,
  FormGroup,
  InputGroup,
  HelpBlock,
  ListGroup,
  ListGroupItem,
  Row,
  Col,
  Button,
  Panel,
  FormControl,
  Glyphicon,
  Badge,
  ButtonGroup,
  DropdownButton,
  MenuItem,
  Label
} from 'react-bootstrap'
import {Map, TileLayer, Rectangle} from 'react-leaflet'

import * as deploymentActions from '../actions/deployments'
import Loading from '../../common/components/Loading'
import EditableTextField from '../../common/components/EditableTextField'
import WatchButton from '../../common/containers/WatchButton'
import {getComponentMessages} from '../../common/util/config'
import {defaultTileURL} from '../../common/util/maps'
import { versionsSorter } from '../../common/util/util'
import DeploymentConfirmModal from './DeploymentConfirmModal'
import DeploymentPreviewButton from './DeploymentPreviewButton'
import DeploymentVersionsTable from './DeploymentVersionsTable'
import {formatTimestamp, fromNow} from '../../common/util/date-time'
import {isValidJSON} from '../../common/util/json'

import type {Props as ContainerProps} from '../containers/ActiveDeploymentViewer'
import type {Deployment} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = ContainerProps & {
  addFeedVersion: typeof deploymentActions.addFeedVersion,
  deleteFeedVersion: typeof deploymentActions.deleteFeedVersion,
  deployToTarget: typeof deploymentActions.deployToTarget,
  downloadDeployment: typeof deploymentActions.downloadDeployment,
  updateDeployment: typeof deploymentActions.updateDeployment,
  updateVersionForFeedSource: typeof deploymentActions.updateVersionForFeedSource,
  user: ManagerUserState
}

type State = {
  searchText: ?string,
  target: ?string
}

const BOUNDS_LIMIT = 10 // Limit for the decimal degrees span

const SAMPLE_BUILD_CONFIG = `{
  "subwayAccessTime": 2.5
}`

const SAMPLE_ROUTER_CONFIG = `{
  "routingDefaults": {
    "walkSpeed": 2.0,
    "stairsReluctance": 4.0,
    "carDropoffTime": 240
  }
}`

export default class DeploymentViewer extends Component<Props, State> {
  messages = getComponentMessages('DeploymentViewer')
  state = {
    searchText: null,
    target: null
  }

  componentDidMount () {
    this.resetMap()
  }

  /**
   * When the component remounts after an initial mount, the map needs to be
   * reset using Leaflet.invalidateSize so that the map tiles do not "grey out."
   *
   * Also, this re-fits the bounds to the deployment bounds.
   */
  resetMap () {
    setTimeout(() => {
      if (this.refs.map) {
        this.refs.map.leafletElement.invalidateSize()
        this.refs.map.leafletElement.fitBounds(this._getBounds())
      }
    }, 500)
  }

  _getBounds = () => {
    const {east, north, south, west} = this.props.deployment.projectBounds ||
      {east: 10, north: 10, west: -10, south: -10}
    return [[north, east], [south, west]]
  }

  _onAddFeedSource = (feedSourceId: string) => {
    const feed = this.props.feedSources.find(fs => fs.id === feedSourceId)
    const id = feed && feed.latestVersionId
    if (!id) {
      console.warn('No latest version ID found for feed', feed)
      return
    }
    this.props.addFeedVersion(this.props.deployment, {id})
  }

  _onChangeSearch = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.setState({searchText: evt.target.value})

  _onChangeName = (name: string) => {
    this.props.updateDeployment(this.props.deployment, {name})
  }

  _onClickDownload = () => this.props.downloadDeployment(this.props.deployment)

  _onCloseModal = () => this.setState({target: null})

  _onSelectTarget = (target: string) => this.setState({target})

  render () {
    const {
      deleteFeedVersion,
      deployment,
      deployToTarget,
      feedSources,
      project,
      updateDeployment,
      updateVersionForFeedSource,
      user
    } = this.props
    const {target} = this.state
    const {feedVersions} = deployment
    if (!deployment || !project || !feedSources) {
      return <Loading />
    }
    // Only permit adding feed sources to non-feed source deployments.
    const deployableFeeds = !deployment.feedSourceId && feedSources
      ? feedSources.filter(fs =>
        // Include feed sources that are not currently added, have feed versions,
        // are marked deployable, and have been validated.
        feedVersions && feedVersions.findIndex(v => v.feedSource.id === fs.id) === -1 &&
        fs.deployable &&
        fs.latestValidation
      )
      : []
    const na = (<span style={{ color: 'lightGray' }}>N/A</span>)
    const versions = feedVersions
      ? feedVersions
        .filter(
          version =>
            version.feedSource.name
              .toLowerCase()
              .indexOf((this.state.searchText || '').toLowerCase()) !== -1
        )
        .sort(versionsSorter)

      : []
    const isMissingBounds = !deployment.projectBounds
    const {east, north, south, west} = deployment.projectBounds ||
      {east: 10, north: 10, west: -10, south: -10}
    const boundsTooLarge = east - west > BOUNDS_LIMIT || north - south > BOUNDS_LIMIT
    const bounds = this._getBounds()
    const isWatchingDeployment = user.subscriptions && user.subscriptions.hasFeedSubscription(
      project.id,
      deployment.id,
      'deployment-updated'
    )
    const earliestDate = formatTimestamp(`${Math.min(...versions.map(v => +v.validationResult.startDate))}`, false)
    const latestDate = formatTimestamp(`${Math.max(...versions.map(v => +v.validationResult.endDate))}`, false)
    const oldDeployment = (target && project.deployments)
      ? project.deployments.find(d => d.deployedTo === target && deployment.routerId === d.routerId)
      : null
    return (
      <div>
        {target &&
          <DeploymentConfirmModal
            deployToTarget={deployToTarget}
            deployment={deployment}
            oldDeployment={oldDeployment}
            onClose={this._onCloseModal}
            target={target} />
        }
        <Row>
          <Col sm={9}>
            <Panel
              header={
                <div>
                  <h4>
                    <ButtonGroup className='pull-right'>
                      <WatchButton
                        isWatching={isWatchingDeployment}
                        user={user}
                        target={deployment.id}
                        subscriptionType='deployment-updated' />
                      <Button
                        bsStyle='default'
                        onClick={this._onClickDownload}>
                        <span><Glyphicon glyph='download' /> {this.messages('download')}</span>
                      </Button>
                      <DropdownButton
                        bsStyle='primary'
                        id='deploy-server-dropdown'
                        pullRight
                        disabled={!project.otpServers || !project.otpServers.length}
                        title={project.otpServers && project.otpServers.length
                          ? <span>
                            <Glyphicon glyph='globe' />{' '}
                            {this.messages('deploy')}
                          </span>
                          : <span>{this.messages('noServers')}</span>
                        }
                        onSelect={this._onSelectTarget}>
                        {project.otpServers
                          ? project.otpServers.map((server, i) => (
                            <MenuItem
                              data-test-id={`deploy-server-${i}-button`}
                              // Disable server if the server is missing a name or
                              // has neither an internal URL or s3 bucket name.
                              disabled={
                                !server.name ||
                                (
                                  (!server.internalUrl || server.internalUrl.length === 0) &&
                                  !server.s3Bucket
                                )
                              }
                              eventKey={server.name}
                              key={i}
                            >
                              {server.name || '[Unnamed]'}
                            </MenuItem>
                          ))
                          : null
                        }
                        {project.otpServers && <MenuItem divider />}
                        <LinkContainer
                          to={`/project/${project.id}/settings/deployment`}
                          key={project.id}>
                          <MenuItem>
                            <Icon type='cog' /> Manage servers
                          </MenuItem>
                        </LinkContainer>
                      </DropdownButton>
                    </ButtonGroup>
                    <EditableTextField
                      inline
                      style={{marginLeft: '5px'}}
                      value={deployment.name}
                      onChange={this._onChangeName} />
                    {deployment.deployedTo
                      ? <span>
                        <Label>{deployment.deployedTo}</Label>
                        {' '}
                        <DeploymentPreviewButton deployment={deployment} />
                      </span>
                      : null
                    }
                  </h4>
                  <small title={deployment.lastDeployed && formatTimestamp(deployment.lastDeployed)}>
                    <Icon type='clock-o' />
                    {' '}
                    Last deployed {deployment.lastDeployed ? fromNow(deployment.lastDeployed) : na}
                  </small>
                </div>
              }>
              <ListGroup fill>
                <ListGroupItem style={{padding: '0px'}}>
                  <Map
                    ref='map'
                    bounds={bounds}
                    scrollWheelZoom={false}
                    style={{width: '100%', height: '300px'}}>
                    <TileLayer
                      url={defaultTileURL()}
                      attribution={process.env.MAPBOX_ATTRIBUTION} />
                    {!isMissingBounds &&
                      <Rectangle
                        bounds={bounds}
                        // If bounds are too large, draw rectangle in red
                        // (otherwise use the default path color).
                        color={boundsTooLarge ? 'red' : '#3388ff'}
                        fillOpacity={0} />
                    }
                  </Map>
                </ListGroupItem>
                <ListGroupItem>
                  <Row>
                    <Col xs={6}>
                      <h4>
                        <Glyphicon glyph='list' /> {this.messages('versions')}{' '}
                        <Badge>{versions.length}</Badge>
                        <br />
                        <small>
                          <Glyphicon glyph='calendar' />{' '}
                          {earliestDate} {this.messages('to')} {latestDate}
                        </small>
                      </h4>
                    </Col>
                    <Col xs={6}>
                      <FormGroup className='pull-right'>
                        <InputGroup>
                          <FormControl
                            type='text'
                            className='pull-right'
                            style={{width: '160px'}}
                            placeholder={this.messages('search')}
                            onChange={this._onChangeSearch} />
                          <DropdownButton
                            id='add-feedsource-button'
                            componentClass={InputGroup.Button}
                            disabled={!deployableFeeds.length}
                            title={deployableFeeds.length
                              ? <span>
                                <Glyphicon glyph='plus' />{' '}
                                {this.messages('addFeedSource')}
                              </span>
                              : <span>{this.messages('allFeedsAdded')}</span>
                            }
                            onSelect={this._onAddFeedSource}>
                            {deployableFeeds.map((fs, i) => (
                              <MenuItem MenuItem key={i} eventKey={fs.id}>{fs.name}</MenuItem>
                            ))}
                          </DropdownButton>
                        </InputGroup>
                      </FormGroup>
                    </Col>
                  </Row>
                </ListGroupItem>
                {versions.length === 0
                  ? <p className='lead text-center margin-top-15'>
                    No feed sources found.
                  </p>
                  : <DeploymentVersionsTable
                    deleteFeedVersion={deleteFeedVersion}
                    updateVersionForFeedSource={updateVersionForFeedSource}
                    user={user}
                    versions={versions}
                    deployment={deployment} />
                }
              </ListGroup>
            </Panel>
          </Col>
          <Col sm={3}>
            <Panel header={<h3><Icon type='cog' /> OTP Configuration</h3>}>
              <ListGroup fill>
                <ListGroupItem>
                  Deploying to the{' '}
                  <small><em>{deployment.routerId || 'default'}</em></small>{' '}
                  OpenTripPlanner router.
                </ListGroupItem>
                <ListGroupItem>
                  <CustomConfig
                    name='customBuildConfig'
                    label='Build'
                    updateDeployment={updateDeployment}
                    deployment={deployment} />
                </ListGroupItem>
                <ListGroupItem>
                  <CustomConfig
                    name='customRouterConfig'
                    label='Router'
                    updateDeployment={updateDeployment}
                    deployment={deployment} />
                </ListGroupItem>
              </ListGroup>
            </Panel>
          </Col>
        </Row>
      </div>
    )
  }
}

class CustomConfig extends Component<{
  deployment: Deployment,
  label: string,
  name: string,
  updateDeployment: typeof deploymentActions.updateDeployment
}, {[string]: any}> {
  state = {}

  _toggleCustomConfig = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const {deployment, updateDeployment} = this.props
    const {name} = evt.target
    const value = deployment[name]
      ? null
      : name === 'customBuildConfig'
        ? SAMPLE_BUILD_CONFIG
        : SAMPLE_ROUTER_CONFIG
    updateDeployment(deployment, {[name]: value})
  }

  _onChangeConfig = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.setState({[this.props.name]: evt.target.value})

  _onSaveConfig = () => {
    const {deployment, name, updateDeployment} = this.props
    const value = this.state[name]
    if (!isValidJSON(value)) return window.alert('Must provide valid JSON string.')
    else {
      updateDeployment(deployment, {[name]: value})
      this.setState({[name]: undefined})
    }
  }

  render () {
    const {deployment, name, label} = this.props
    const useCustom = deployment[name] !== null
    const value = this.state[name] || deployment[name]
    const validJSON = isValidJSON(value)
    return (
      <div>
        <h5>{label} configuration</h5>
        <FormGroup>
          <Radio
            checked={!useCustom}
            name={name}
            onChange={this._toggleCustomConfig}
            inline>
            Project default
          </Radio>
          <Radio
            checked={useCustom}
            name={name}
            onChange={this._toggleCustomConfig}
            inline>
            Custom
          </Radio>
        </FormGroup>
        <p>
          {useCustom
            ? `Use custom JSON defined below for ${label} configuration.`
            : `Use the ${label} configuration defined in the project deployment settings.`
          }
          <span>{' '}
            {useCustom
              ? <Button
                style={{marginLeft: '15px'}}
                bsSize='xsmall'
                disabled={!this.state[name] || !validJSON}
                onClick={this._onSaveConfig}>Save</Button>
              : <LinkContainer
                to={`/project/${deployment.project.id}/settings/deployment`}>
                <Button bsSize='xsmall'>
                  <Icon type='pencil' /> Edit
                </Button>
              </LinkContainer>
            }
          </span>
        </p>
        {useCustom &&
          <FormGroup validationState={validJSON ? null : 'error'}>
            <FormControl
              componentClass='textarea'
              style={{height: '125px'}}
              placeholder='{"blah": true}'
              onChange={this._onChangeConfig}
              value={value} />
            {!validJSON && <HelpBlock>Must provide valid JSON string.</HelpBlock>}
          </FormGroup>
        }
      </div>
    )
  }
}
