import React from 'react'
// import qs from 'qs'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { routerRedux } from 'dva/router'
import Card from './HCard'
import DataTable from '../../../components/AutoDataTable/DataTable'
import { Icon, Modal, Button, message } from 'antd'
import { dateTimeFormat } from '../../../utils'
// import styles from './styles.less'

const confirm = Modal.confirm

/**
 * @author ruanhao
 */
class BondRate extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      // 从 Form 子组件获得的表单值
      formValues: {},
    }
  }

  onFormQuery= (values) => {
    this.setState({ formValues: values })

    // 外部发起请求，不建议。难以维护 table 内部的分页状态。
    // this.fetchAction({
    //   currentPage: 1,
    //   pageSize: 15
    // })
  }

  onDeleteItem (id, queryParams) {
    this.props.dispatch({
      type: 'bond/deleteData',
      payload: {
        id,
        queryParams,
      },
    })
  }
  // 债券评级页面跳转链接函数
  onJumpDetail (rowId) {
    this.props.dispatch({
      type: 'bond/getRateFormDetail',
      payload: { detail: 'detail' },
    })
    this.props.dispatch({ type: 'bond/getRateForm', payload: { id: rowId } })
    this.props.dispatch(routerRedux.push({
      pathname: '/bond/rate/add',
    }))
  }
  fetchAction = (params) => {
    // query All
    /*
    this.props.dispatch({
      type: 'ecoAnalysis/getTableDataAll',
      payload: {
        pageSize: 15,
        currentPage: 1
      },
    })
    */
    // remote paging
    this.props.dispatch({
      type: 'bond/getTableData',
      payload: {
        ...params,
      },
    })
  }

  add = () => {
    this.props.dispatch({
      type: 'bond/getRateFormDetail',
      payload: { detail: '' },
    })
    this.props.dispatch({
      type: 'bond/clearRateForm',
      payload: {},
    })
    this.props.dispatch(routerRedux.push({
      pathname: '/bond/rate/add',
    }))
  }

  render () {
    let operate = [{
      name: '修改',
      value: <Icon type="edit" />,
      event: (row, tableData, rowindex, params) => {
        if (row.postStatus === '1') {
          message.warning('已提交不可编辑!')
          return
        }
        this.props.dispatch({
          type: 'bond/getRateFormDetail',
          payload: { detail: '' },
        })
        this.props.dispatch({
          type: 'bond/clearRateForm',
          payload: {},
        })
        this.props.dispatch({ type: 'bond/getRateForm', payload: { id: row.id } })
        this.props.dispatch(routerRedux.push({
          pathname: '/bond/rate/add',
        }))
      },
    }, {
      name: '删除',
      value: <Icon type="delete" />,
      event: (row, tableData, rowindex, params) => {
        if (row.postStatus === '1') {
          message.warning('已提交不可删除!')
          return
        }
        confirm({
          title: '您确定要删除这条记录吗?',
          onOk: () => {
            let queryParams = { ...params, ...this.state.formValues }
            this.onDeleteItem(row.id, queryParams)
          },
        })
      },
    }]

    const renderers = {
      bondName: (row, tableData, rowindex) => {
        return <a href="javascript:void(0)" onClick={this.onJumpDetail.bind(this, row.id)}>{row.bondName}</a>
      },
      postStatus: (row, tableData, rowindex) => {
        if (row.postStatus === '0') {
          return '未发布'
        }
        return '已发布'
      },
      rateTime: (row, tableData, rowindex) => dateTimeFormat(row.rateTime),
    }
    return (<div>
      <Card title="结果列表" className="defaultMark" collapsible={Boolean(false)} extra={<Button type="default" onClick={this.add} style={{ float: 'right' }} >新增</Button>}>
        <DataTable tableData={this.props.bond.tabledata}
          fetchAction={this.fetchAction}
          queryParams={this.state.formValues}
          remotePaging
          sorters={{
 internalRate: true, rateStaff: true, rateTime: true, postStatus: true,
}}
          size="middle"
          /* editable
          editors={[true, true, true, true]} */
          operate={operate}
          renderers={renderers}
        />
      </Card>
    </div>)
  }
}

BondRate.propTypes = {
  dispatch: PropTypes.func,
  bond: PropTypes.object.isRequired,
}

export default connect(({ bond }) => ({
  bond,
}))(BondRate)
