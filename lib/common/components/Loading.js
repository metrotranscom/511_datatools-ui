// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Row, Col } from 'react-bootstrap'

type Props = {
  inline?: boolean,
  small?: boolean,
  style?: {[string]: string | number}
}

export default class Loading extends Component<Props> {
  render () {
    const {inline, small, style} = this.props
    const icon = (
      <Icon
        style={style}
        className={`fa-spin ${small ? '' : 'fa-5x'}`}
        type='refresh' />
    )
    // If inline prop is used, simply return the icon. Otherwise, return it
    // wrapped in a bootstrap row.
    return inline
      ? icon
      : <Row>
        <Col xs={12}>
          <p className='text-center'>
            {icon}
          </p>
        </Col>
      </Row>
  }
}
