import React from 'react'
import PropTypes from 'prop-types'
import { Input, Button } from 'antd'
import classNames from 'classnames'

const InputGroup = Input.Group

export default class SearchInput extends React.Component {
  static propTypes = {
    onSearch: PropTypes.func,
    style: PropTypes.string,
    size: PropTypes.string,
    placeholder: PropTypes.string,
  }

  constructor (props) {
    super(props)
    this.state = {
      value: '',
      focus: false,
    }
  }

  handleInputChange = (e) => {
    this.setState({
      value: e.target.value,
    })

    if (this.props.onSearch) {
      this.props.onSearch(e.target.value.trim())
    }
  }

  handleFocusBlur = (e) => {
    this.setState({
      focus: e.target === document.activeElement,
    })
  }

  handleSearch = () => {
    if (this.props.onSearch) {
      this.props.onSearch(this.state.value)
    }
  }

  render = () => {
    const { style, size, placeholder } = this.props
    const btnCls = classNames({
      'ant-search-btn': true,
      'ant-search-btn-noempty': !!this.state.value.trim(),
    })
    const searchCls = classNames({
      'ant-search-input': true,
      'ant-search-input-focus': this.state.focus,
    })
    return (
      <div className="ant-search-input-wrapper" style={style}>
        <InputGroup className={searchCls}>
          <Input placeholder={placeholder}
            value={this.state.value}
            onChange={this.handleInputChange}
            onFocus={this.handleFocusBlur}
            onBlur={this.handleFocusBlur}
            onPressEnter={this.handleSearch}
          />
          <div className="ant-input-group-wrap">
            <Button icon="search" className={btnCls} size={size} onClick={this.handleSearch} />
          </div>
        </InputGroup>
      </div>
    )
  }
}
