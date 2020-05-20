// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Col, Row, ListGroup, ListGroupItem, Button, Panel, FormControl, InputGroup, ControlLabel, FormGroup, Checkbox} from 'react-bootstrap'
import {LinkContainer} from 'react-router-bootstrap'

import * as feedsActions from '../actions/feeds'
import toSentenceCase from '../../common/util/to-sentence-case'
import ExternalPropertiesTable from './ExternalPropertiesTable'

import type {Feed, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  activeComponent: string,
  activeSubComponent: string,
  confirmDeleteFeedSource: () => void,
  feedSource: Feed,
  project: Project,
  updateExternalFeedResource: typeof feedsActions.updateExternalFeedResource,
  updateFeedSource: typeof feedsActions.updateFeedSource,
  user: ManagerUserState
}

type State = {
  name?: ?string,
  url?: ?string
}

export default class FeedSourceSettings extends Component<Props, State> {
  state = {}

  _onChange = ({target}: SyntheticInputEvent<HTMLInputElement>) => {
    // Change empty string to null to avoid setting URL to empty string value.
    const value = target.value === '' ? null : target.value.trim()
    this.setState({[target.name]: value})
  }

  _onToggleDeployable = () => {
    const {feedSource, updateFeedSource} = this.props
    updateFeedSource(feedSource, {deployable: !feedSource.deployable})
  }

  _getFormValue = (key: 'name' | 'url') => {
    // If state value does not exist (i.e., form is unedited), revert to value
    // from props.
    const value = typeof this.state[key] === 'undefined'
      ? this.props.feedSource[key]
      : this.state[key]
    // Revert to empty string to avoid console error with null value for form.
    return value || ''
  }

  _onToggleAutoFetch = () => {
    const {feedSource, updateFeedSource} = this.props
    const value = feedSource.retrievalMethod === 'FETCHED_AUTOMATICALLY'
      ? 'MANUALLY_UPLOADED'
      : 'FETCHED_AUTOMATICALLY'
    updateFeedSource(feedSource, {retrievalMethod: value})
  }

  _onTogglePublic = () => {
    const {feedSource, updateFeedSource} = this.props
    updateFeedSource(feedSource, {isPublic: !feedSource.isPublic})
  }

  _onNameChanged = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({name: evt.target.value})
  }

  _onNameSaved = () => {
    const {feedSource, updateFeedSource} = this.props
    updateFeedSource(feedSource, {name: this.state.name})
  }

  _onSaveUrl = () => {
    const {feedSource, updateFeedSource} = this.props
    updateFeedSource(feedSource, {url: this.state.url})
  }

  render () {
    const {
      activeComponent,
      activeSubComponent,
      confirmDeleteFeedSource,
      updateExternalFeedResource,
      feedSource,
      project,
      user
    } = this.props
    const {
      name,
      url
    } = this.state
    const disabled = user.permissions && !user.permissions.hasFeedPermission(
      project.organizationId, project.id, feedSource.id, 'manage-feed'
    )
    const isProjectAdmin = user.permissions && user.permissions.isProjectAdmin(
      project.id, project.organizationId
    )
    // const editGtfsDisabled = !user.permissions.hasFeedPermission(project.organizationId, project.id, feedSource.id, 'edit-gtfs')
    const autoFetchFeed = feedSource.retrievalMethod === 'FETCHED_AUTOMATICALLY'
    const resourceType = activeComponent === 'settings' && activeSubComponent && activeSubComponent.toUpperCase()
    if (disabled) {
      return (
        <Row>
          <Col xs={6} mdOffset={3}>
            <p className='lead text-center'><strong>Warning!</strong> You do not have permission to edit details for this feed source.</p>
          </Col>
        </Row>
      )
    }
    return (
      <Row>
        <Col xs={3}>
          {/* Side panel */}
          <Panel>
            <ListGroup fill>
              <LinkContainer
                to={`/feed/${feedSource.id}/settings`}
                active={!activeSubComponent}>
                <ListGroupItem>General</ListGroupItem>
              </LinkContainer>
              {Object.keys(feedSource.externalProperties || {}).map(resourceType => {
                const resourceLowerCase = resourceType.toLowerCase()
                return (
                  <LinkContainer
                    key={resourceType}
                    to={`/feed/${feedSource.id}/settings/${resourceLowerCase}`}
                    active={activeSubComponent === resourceLowerCase}>
                    <ListGroupItem>{toSentenceCase(resourceType)} properties</ListGroupItem>
                  </LinkContainer>
                )
              })}
            </ListGroup>
          </Panel>
        </Col>
        <Col xs={6} />
        {!resourceType
          ? <Col xs={7}>
            {/* Settings */}
            <Panel header={<h3>Settings</h3>}>
              <ListGroup fill>
                <ListGroupItem>
                  <FormGroup>
                    <ControlLabel>Feed source name</ControlLabel>
                    <InputGroup>
                      <FormControl
                        value={this._getFormValue('name')}
                        name={'name'}
                        disabled={disabled}
                        onChange={this._onChange} />
                      <InputGroup.Button>
                        <Button
                          // disable if no change or no value (name is required).
                          disabled={disabled || !name || name === feedSource.name}
                          onClick={this._onNameSaved}>
                          Rename
                        </Button>
                      </InputGroup.Button>
                    </InputGroup>
                  </FormGroup>
                </ListGroupItem>
                <ListGroupItem>
                  <FormGroup>
                    <Checkbox
                      checked={feedSource.deployable}
                      data-test-id='make-feed-source-deployable-button'
                      onChange={this._onToggleDeployable}>
                      <strong>Make feed source deployable</strong>
                    </Checkbox>
                    <small>Enable this feed source to be deployed to an OpenTripPlanner (OTP) instance (defined in organization settings) as part of a collection of feed sources or individually.</small>
                  </FormGroup>
                </ListGroupItem>
              </ListGroup>
            </Panel>
            <Panel header={<h3>Automatic fetch</h3>}>
              <ListGroup fill>
                <ListGroupItem>
                  <FormGroup>
                    <ControlLabel>Feed source fetch URL</ControlLabel>
                    <InputGroup data-test-id='feed-source-url-input-group'>
                      <FormControl
                        disabled={disabled}
                        name={'url'}
                        onChange={this._onChange}
                        value={this._getFormValue('url')}
                      />
                      <InputGroup.Button>
                        <Button
                          // Disable if no change or field has not been edited.
                          disabled={disabled || typeof url === 'undefined' || url === feedSource.url}
                          onClick={this._onSaveUrl}>
                          Change URL
                        </Button>
                      </InputGroup.Button>
                    </InputGroup>
                  </FormGroup>
                </ListGroupItem>
                <ListGroupItem>
                  <FormGroup>
                    <Checkbox
                      checked={autoFetchFeed}
                      disabled={disabled}
                      onChange={this._onToggleAutoFetch}
                      bsStyle='danger'>
                      <strong>Auto fetch feed source</strong>
                    </Checkbox>
                    <small>Set this feed source to fetch automatically. (Feed source URL must be specified and project auto fetch must be enabled.)</small>
                  </FormGroup>
                </ListGroupItem>
              </ListGroup>
            </Panel>
            <Panel bsStyle='danger' header={<h3>Danger zone</h3>}>
              <ListGroup fill>
                <ListGroupItem>
                  <Button
                    onClick={this._onTogglePublic}
                    disabled={disabled}
                    className='pull-right'>
                    Make {feedSource.isPublic ? 'private' : 'public'}
                  </Button>
                  <h4>Make this feed source {feedSource.isPublic ? 'private' : 'public'}.</h4>
                  <p>This feed source is currently {feedSource.isPublic ? 'public' : 'private'}.</p>
                </ListGroupItem>
                <ListGroupItem>
                  <Button
                    onClick={confirmDeleteFeedSource}
                    className='pull-right'
                    disabled={disabled}
                    bsStyle='danger'>
                    <Icon type='trash' /> Delete feed source
                  </Button>
                  <h4>Delete this feed source.</h4>
                  <p>Once you delete a feed source, it cannot be recovered.</p>
                </ListGroupItem>
              </ListGroup>
            </Panel>
          </Col>
          : <Col xs={7}>
            <ExternalPropertiesTable
              resourceType={resourceType}
              feedSource={feedSource}
              editingIsDisabled={disabled}
              isProjectAdmin={isProjectAdmin}
              resourceProps={feedSource.externalProperties
                ? feedSource.externalProperties[resourceType]
                : {}
              }
              updateExternalFeedResource={updateExternalFeedResource} />
          </Col>
        }
      </Row>
    )
  }
}
