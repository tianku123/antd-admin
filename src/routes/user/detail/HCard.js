import React from 'react'
import PropTypes from 'prop-types'
import { Card, Icon } from 'antd'
import { config } from '../../../utils'

export default class HCard extends React.Component {
  static defaultProps = {
    collapsible: true,
    bordered: false,
  }
  constructor (props) {
    super(props)
    this.state = {
      foldDisable: true,
      displayValue: 'block',
    }
    if (props.defaultFold != null && props.defaultFold === true) {
      this.state.foldDisable = false
      this.state.displayValue = 'none'
    }
  }
  // 外部控制Card的折叠和展开
  componentWillReceiveProps (nextProps) {
    if (nextProps.defaultFold != this.props.defaultFold) {
      if (nextProps.defaultFold) {
        this.setState({ foldDisable: false, displayValue: 'none' })
      } else {
        this.setState({ foldDisable: true, displayValue: 'block' })
      }

      this.state.foldDisable = false
      this.state.displayValue = 'none'
    }
  }
  // 图标点击切换函数
  foldIcon= () => {
    if (this.state.foldDisable) {
      this.setState({ foldDisable: !this.state.foldDisable })
      this.setState({ displayValue: 'none' })
    } else {
      this.setState({ foldDisable: !this.state.foldDisable })
      this.setState({ displayValue: 'block' })
    }
  }
  render () {
    let extraDom = (
      <div>
        {this.props.collapsible ? <Icon type={this.state.foldDisable ? 'up-circle-o' : 'down-circle-o'}
          onClick={this.foldIcon}
          style={{ fontSize: '15px' }}
        /> : null}
        {this.props.extra}
      </div>
    )
    return (
      <Card
        title={this.props.title}
        className={this.props.className}
        bordered={this.props.bordered}
        bodyStyle={{ display: this.state.displayValue }}
        extra={extraDom}
      >
        {this.props.children}
      </Card>
    )
  }
}

HCard.propTypes = {
  // Card的标题
  title: PropTypes.string,
  bordered: PropTypes.bool.isRequired,
  className: PropTypes.string,
  collapsible: PropTypes.bool,
  extra: PropTypes.node,
  children: PropTypes.node,
  defaultFold: PropTypes.bool,
}
