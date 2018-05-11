import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Table, Button, Icon, Tooltip } from 'antd'
import styles from './style.less'
import SearchInput from './SearchInput'

export default class BaseTable extends Component {
  getUpdateLabel () {
    let updateLabel = null
    if (this.props.updateTime != null) {
      let top = 4
      // 分页且有数据
      if (this.props.pagination && this.props.dataSource.length > 0) { top = -24}

      // console.log(this.props.pagination)
      updateLabel = (<div><span style={{ float: 'left', marginTop: top, marginLeft: '5px' }}>
              最近更新于：{this.props.updateTime}</span></div>)
    }

    return updateLabel
  }

  render () {
    let updateLabel = this.getUpdateLabel()

    let searcher = null
    if (this.props.onSearch != null) {
      searcher = (<SearchInput style={{}}
        placeholder="输入搜索文本"
        onSearch={this.props.onSearch}
        onChange={this.props.immediateSearch ? this.props.onSearch : null}
      />)
    }

    let title = null
    /*
    if (this.props.title != null) {
        title = <h3 className="table-title">{this.props.title}</h3>
    }
    */

    let tools = []
    if (this.props.editable) {
      if (this.props.status === 'edit') {
        tools.push(<Button key="cancel"
          type="ghost"
          shape="circle-outline"
          size="small"
          onClick={this.props.onCancel}
          className={styles['tool-btn']}
        >
          <Icon type="cross" />
        </Button>)

        tools.push(<Button key="submit"
          type="ghost"
          shape="circle-outline"
          size="small"
          onClick={this.props.onSave}
          className={styles['tool-btn']}
        >
          <Icon type="check" />
        </Button>)
      } else if (this.props.status === 'save') {
        tools.push(<Button key="save"
          type="primary"
          shape="circle-outline"
          size="small"
          className={styles['tool-btn']}
        >
          <Icon type="loading" />
        </Button>)
      } else if (this.props.status === 'error') {
        tools.push(<Tooltip title="保存失败,点击再次编辑">
          <Button key="error"
            className="errorbutton"
            type="primary"
            shape="circle-outline"
            size="small"
            onClick={this.props.onEdit}
            className={styles['tool-btn']}
          >
            <Icon type="exclamation" />
          </Button>
        </Tooltip>)
      } else { // "normal"
        /*
        else if(this.props.status ==="success")
        {
            tools.push(<Tooltip title="保存成功,点击再次编辑">
                    <Button className="successbutton"  type="primary" shape="circle-outline" onClick={this.props.onEdit} style={{float:'right',marginRight:'12px',marginTop:'6px'}}>
                      <Icon type="exclamation" />
                    </Button>
                  </Tooltip>);
        }
        */
        tools.push(<Button key="edit"
          type="ghost"
          shape="circle-outline"
          size="small"
          onClick={this.props.onEdit}
          className={styles['tool-btn']}
        >
          <Icon type="edit" />
        </Button>)
      }
    }

    const {
      updateTime, editable, status, onSearch, onEdit, onCancel, onSave, ...otherProps
    } = this.props
    return (
      <div>
        {title}
        {searcher}
        {tools}
        <div style={{ clear: 'both' }} />
        <Table className={styles.table} {...otherProps} />
        {updateLabel}
        <div style={{ clear: 'both' }} />
      </div>
    )
  }
}

BaseTable.propTypes = {
  dataSource: PropTypes.array.isRequired,
  pagination: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  // columns: PropTypes.array.isRequired,
  // onChange: PropTypes.func,
  // title: PropTypes.string,
  updateTime: PropTypes.string, // 如果不为空，左下角显示最新更新时间
  editable: PropTypes.bool,
  status: PropTypes.string,
  onSearch: PropTypes.func,
  onEdit: PropTypes.func,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  immediateSearch: PropTypes.bool, // 搜索框响应输入事件
}
