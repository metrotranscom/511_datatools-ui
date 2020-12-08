// @flow

import {connect} from 'react-redux'

import {
  addFeedVersion,
  deleteFeedVersion,
  deployToTarget,
  downloadBuildArtifact,
  downloadDeployment,
  fetchDeployment,
  terminateEC2InstanceForDeployment,
  updateDeployment,
  updateVersionForFeedSource
} from '../actions/deployments'
import DeploymentViewer from '../components/DeploymentViewer'

import type {Deployment, Feed, Project} from '../../types'
import type {AppState} from '../../types/reducers'

export type Props = {
  deployment: Deployment,
  feedSources: Array<Feed>,
  project: Project
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const user = state.user
  const deployJobs = state.status.jobMonitor.jobs
    .filter(job => job.deploymentId === ownProps.deployment.id)
  return {
    deployJobs,
    user
  }
}

const mapDispatchToProps = {
  addFeedVersion,
  deleteFeedVersion,
  deployToTarget,
  downloadBuildArtifact,
  downloadDeployment,
  fetchDeployment,
  terminateEC2InstanceForDeployment,
  updateDeployment,
  updateVersionForFeedSource
}

const ActiveDeploymentViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeploymentViewer)

export default ActiveDeploymentViewer
