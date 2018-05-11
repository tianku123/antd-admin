import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { message, Tooltip } from 'antd'
import { List, fromJS, is } from 'immutable'
import BaseTable from './BaseTable'
import { isObjectContentEqual } from '../utils/index'
import styles from './style.less'

/**
 * 接受自描述 tableData，自动创建表结构。
 * 前端分页时，可外部发起数据请求，直接传递 tableData，也可以传递 fetchAction，内部发起请求调用。
 * 远程分页获取数据。传递 fetchAction, queryParams，内部自动检查查询条件变化，由内部发起数据查询请求。
 * @author shiliangdong
 */
export default class DataTable extends Component {
  static defaultProps = {
    pageSize: 15,
    pageSizeOptions: ['15', '30', '50', '100'],
    // 周期为0时，如果传递 fetchAction，则默认组件加载后发起一次请求
    refreshInterval: 0,
    showUpdateTime: false,
    showQuickFilter: false,
    autoUpdateSameValue: false,
    showLoading: true,
    queryParams: {},
  }

  static propTypes = {
    // 外部传入的 列renderer
    renderers: PropTypes.object,
    sorters: PropTypes.object,
    pageSize: PropTypes.number,
    pageSizeOptions: PropTypes.array,
    loading: PropTypes.bool,
    // 是否可编辑
    editable: PropTypes.bool,
    // 指定哪些列可编辑，哪些需提交
    editors: PropTypes.array,
    // 指定哪些列隐藏
    hiddens: PropTypes.object,
    // 自动更新同一列后面相同的值
    autoUpdateSameValue: PropTypes.bool,
    // 操作函数数组
    operate: PropTypes.array,
    postUrl: PropTypes.string,
    showSorter: PropTypes.bool,
    // 是否显示全局快速过滤框
    showQuickFilter: PropTypes.bool,
    // 是否显示数据更新时间
    showUpdateTime: PropTypes.bool,
    showPager: PropTypes.bool,
    title: PropTypes.string,
    // 自动刷新的周期。0为不刷新只查询一次;-1表示组件加载完不执行首次查询
    refreshInterval: PropTypes.number,
    // 采用远程分页
    remotePaging: PropTypes.bool,
    tailCol: PropTypes.shape({
      title: PropTypes.string,
      id: PropTypes.string,
    }),
    columnsConfig: PropTypes.object,
    // 表格自描述数据。格式为{ids:[], hds[], rows:[], ...}
    tableData: PropTypes.object,
    // 表格的数据获取时间
    updateTime: PropTypes.string,
    // 外部传入的获取数据的方法，调用的时候会传递 params 参数，包括分页等信息。
    fetchAction: PropTypes.func,
    // 用以区分不同的 fetchAction，以触发重载
    tag: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    // 额外的查询条件，当条件变化后，内部会触发重新请求。
    queryParams: PropTypes.object,
    // 是否显示 loading
    showLoading: PropTypes.bool,
  }

  constructor (props) {
    super(props)

    let imrows = null
    if (props.tableData != null && props.tableData.rows != null)
      {imrows = fromJS(props.tableData.rows);}
    else
      {imrows = new List();}

    this.state = {
      filterValue: '',
      currentPage: 1,
      pageSize: props.pageSize,
      sortField: '',
      sortOrder: '',
      status: 'normal',
      imrows,
      loading: false,
    }
  }

  componentDidMount () {
    // console.log('datatable mount')
    // if (typeof this.props.fetchAction !== 'function')
    // return;

    this.startTimer()
  }

  componentWillReceiveProps (nextProps) {
    // 深拷贝数组
    // let rows = JSON.parse(JSON.stringify(nextProps.tableData.rows));
    if (nextProps.tableData != null && nextProps.tableData.rows != null) {
      let imrows = fromJS(nextProps.tableData.rows)
      // 校验是否和当前 data 一致 TODO
      this.setState({
        imrows,
      })
    } else
      {this.setState({
        imrows: new List()
      })}

    if (nextProps.refreshInterval <= 0) {
      this.stopTimer()
    }

    if (typeof nextProps.fetchAction !== 'function')
      {return;}

    // console.log(this.props.fetchAction.toString(), nextProps.fetchAction.toString())
    // 当fetchAction 变化, 刷新周期从0到>0，或 tag变化时重置取数定时器，并立即执行一次。
    if (this.props.fetchAction.toString() !== nextProps.fetchAction.toString()
    || !isObjectContentEqual(this.props.queryParams, nextProps.queryParams)
    || (this.props.refreshInterval <= 0 && nextProps.refreshInterval > 0)
    || this.props.tag !== nextProps.tag) {
      this.stopTimer()

      // 改变查询条件后，页码归一，其他保持。
      let params = {
        currentPage: 1,
        pageSize: this.state.pageSize,
        sortField: this.state.sortField,
        sortOrder: this.state.sortOrder,
      }
      this.setState({
        ...params,
        loading: true,
      })

      this.startTimer(nextProps, params) // 仍会判断 interval
    } else {
      this.setState({
        loading: false,
      })
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    // if (this.state.status === 'edit' && nextState.status === 'edit')
    // return false;
    // this.state = {
    //     filterValue: '',
    //     currentPage: 1,
    //     pageSize: props.pageSize,
    //     sortField: '',
    //     sortOrder: '',
    //     status: 'normal',
    //     imrows: imrows
    // };

    return true
  }

  componentWillUnmount () {
    // console.log('datatable unmount')

    this.stopTimer()
  }

  onQuickFilter = (v) => {
    // console.log(v);

    this.setState({
      filterValue: v,
    })

    if (this.props.remotePaging) {
      let params = {
        pageSize: this.state.pageSize,
        currentPage: this.state.currentPage,
        sortField: this.state.sortField,
        sortOrder: this.state.sortOrder,
        search: v,
      }
      this.stopTimer()
      this.startTimer(null, params)
    }
  }

  getTableConfigs (tableData) {
    let columns = this.getColumns(tableData)

    this.applyColumnConfig(columns)

    const dataSource = this.filterData(this.state.imrows.toJS(), tableData)

    let total = dataSource.length
    if (this.props.remotePaging)
      {total = tableData.total;}

    const pagination = {
      total,
      showSizeChanger: true,
      // showQuickJumper: true,
      pageSize: this.state.pageSize,
      current: this.state.currentPage,
      sortField: this.state.sortField,
      sortOrder: this.state.sortOrder,
      size: 'small',
      pageSizeOptions: this.props.pageSizeOptions,
    }

    return {
      columns,
      dataSource,
      pagination,
    }
  }

  // 表格头部定义
  getColumns (tableData) {
    if (tableData && tableData.ids && tableData.ids.length > 0
    && tableData.hds && tableData.hds.length > 0
    && tableData.ids.length === tableData.hds.length) {
      let columns = []

      let hiddens = this.props.hiddens
      if (tableData.hiddens)
        {hiddens = tableData.hiddens;}

      for (let i in tableData.ids) {
        let colid = tableData.ids[i]
        if (colid === 'ROWID')
          {continue;}

        if (hiddens != null && hiddens[tableData.ids[i]] === true)
          {continue;}

        let col = {
          title: tableData.hds[i],
          dataIndex: colid,
        }
        // if(colid !== 'ROWID')
        // {
        // col.sorter = true;
        // }

        if (/* this.props.showSorter !== false && */ this.props.sorters && this.props.sorters[colid] != null) {
          // 根据参数配置排序属性
          col.sorter = this.props.sorters[colid]
        } else if (this.props.remotePaging !== true && colid !== 'ROWID') {
          // 本地模式下，自动添加排序配置，除非showSorter为 false
          if (this.props.showSorter !== false && col.sorter == null) {
            Object.assign(col, {
              sorter: (a, b) => {
                let va = a[colid]
                let vb = b[colid]

                // 如果是 react 加工后的对象，则取原始数据进行比较
                if (React.isValidElement(va)) {
                  let li = a.key.lastIndexOf('row')
                  let index = a.key.substring(li + 3)

                  va = tableData.rows[parseInt(index, 10) - 1][colid]
                  if (typeof va === 'object')
                    {va = va.value}
                // console.log(va)
                }
                if (React.isValidElement(vb)) {
                  let li = b.key.lastIndexOf('row')
                  let index = b.key.substring(li + 3)

                  vb = tableData.rows[parseInt(index, 10) - 1][colid]
                  if (typeof vb === 'object')
                    {vb = vb.value}
                // console.log(vb)
                }

                if (va == null && vb == null)
                  {return 0}
                else if (va == null && vb != null)
                  {return 1}
                else if (vb == null && va != null)
                  {return -1}
                else if (typeof va === 'number' && typeof vb === 'number')
                  {return va - vb;}
                else if (typeof va === 'string' && typeof vb === 'string')
                  {return va.localeCompare(vb)}
                return va.length - vb.length
              },
            })
          }

          Object.assign(col, {
            onFilter: (value, record) => {
              return record[colid].indexOf(value) >= 0
            },
          })
        }

        columns.push(col)
      }

      if (this.props.tailCol != null)
        {columns.push({
          title: this.props.tailCol.title,
          dataIndex: this.props.tailCol.id
        })}

      // 具有操作项
      if (typeof (this.props.operate) === 'object' && this.props.operate.length > 0)
        {columns.push({
          title: '操作',
          dataIndex: '_operate_'
        })}

      return columns
    }

    console.error('table data format error:')
    console.error(tableData)

    return []
  }

  getParams () {
    let params = {}
    if (this.props.remotePaging === true) {
      params = {
        pageSize: this.state.pageSize,
        currentPage: this.state.currentPage,
        sortField: this.state.sortField,
        sortOrder: this.state.sortOrder,
        search: this.state.filterValue,
      }
    }

    return params
  }

  getNeedEditable = (editors) => {
    let needEditable = []
    if (editors && editors.length > 0) {
      needEditable = editors.map((editor) => {
        if (editor === true || editor.editable === true)
          {return true;}
        return false
      })
    }

    return needEditable
  }

  /**
   * 启动定时刷新。如果刷新周期为0，只捞取一次数据;刷新周期为负，不捞取。
   * @param {*} _props
   * @param {*} _params
   */
  startTimer (_props, _params) {
    let fetchAction = this.props.fetchAction
    if (_props != null)
      {fetchAction = _props.fetchAction;}
    if (typeof fetchAction !== 'function')
      {return;}

    let refreshInterval = this.props.refreshInterval
    if (_props != null)
      {refreshInterval = _props.refreshInterval;}
    if (typeof refreshInterval !== 'number')
      {refreshInterval = 0;}

    let queryParams = this.props.queryParams
    if (_props != null)
      {queryParams = _props.queryParams;}

    let params = _params
    if (params == null)
      {params = this.getParams();}

    if (refreshInterval >= 0)
      {fetchAction(this.formatPageParams({...params, ...queryParams}));}

    if (refreshInterval > 0) {
      this.timer = setInterval(() => {
        // console.log(`update info`);

        fetchAction(this.formatPageParams({ ...params, ...queryParams }))
      }, refreshInterval)
    }
  }

  stopTimer () {
    clearInterval(this.timer)
    this.timer = null
  }

  inputValueChange (key, rowindex, event) {
    // console.log(event.target);
    // event.target.class+=' success-value-span';

    const oldvalue = this.state.imrows.getIn([rowindex, key])
    const newvalue = event.target.value.substr(0, 140)

    let imrows = this.state.imrows.setIn([rowindex, key], newvalue)
    // imrows: imrows.update( rowindex, row => row.set(key,newvalue) )
    if (!this.props.autoUpdateSameValue) {
      // IE浏览器初始会触发该函数，加个值判定防止时间损耗 todo
      // if (oldvalue != newvalue) {
      // }
    } else {
      for (let i = rowindex + 1; i < this.state.imrows.count(); i++) {
        let nextValue = this.state.imrows.getIn([i, key])
        if (nextValue === oldvalue) { // todo 暂时不严格等，后面需支持类型输入
          imrows = imrows.setIn([i, key], newvalue)
        } else {
          break
        }
      }
    }

    this.setState({
      imrows,
    })
  }

  // 进入编辑状态，对input进行初始化,并清除编辑区域所有颜色标记
  editClick = () => {
    this.stopTimer()

    let tableData = this.props.tableData
    let editors = this.props.editors
    if (tableData.editors)
      {editors = tableData.editors;}

    let needEditable = this.getNeedEditable(editors)

    // 遍历row
    let rows = this.state.imrows
    for (let i = 0, l = rows.size; i < l; i++) {
      for (let j = 0, m = needEditable.length; j < m; j++) {
        // 可编辑且编辑内容已加颜色标记
        if (needEditable[j] && React.isValidElement(rows.get(i).get(tableData.ids[j]))) {
          // 清除颜色标记
          // console.log(rows.get(i).get(tableData.ids[j]));
          rows = rows.update(i, row => row.update(tableData.ids[j], value => value.props.children))
        }
      }
    }

    this.setState({
      status: 'edit',
      imrows: rows,
    })
  }

  // 退出编辑状态，还原表格数据并对input进行初始化
  cancelClick = () => {
    this.startTimer()

    let status = 'normal'
    let imrows = fromJS(this.props.tableData.rows)
    this.setState({
      status,
      imrows,
    })
  }

  // 保存数据
  saveClick = () => {
    let oldrows = fromJS(this.props.tableData.rows)
    // 数据未发生变化
    if (is(this.state.imrows, oldrows)) {
      this.setState({
        status: 'normal',
      })
    } else {
      // 数据数目前后不一致，错误
      if (oldrows.size !== this.state.imrows.size) {
        message.error('数据行数前后不一致，无法保存！')
        this.setState({
          status: 'error',
        })
      } else {
        // 存放不一致的行数据
        let changerownum = []
        let changerows = []
        for (let i = 0, j = oldrows.size; i < j; i++) {
          if (!is(oldrows.get(i), this.state.imrows.get(i))) {
            changerownum.push(i)
            changerows.push(this.state.imrows.get(i).toJS())
          }
        }
        this.postChangedData(changerownum, changerows)
      }
    }
  }

  postChangedData (changerownum, changerows) {
    if (this.props.postUrl != null) {
      this.setState({
        status: 'save',
      }) // 修改状态为载入中
      let endpoint = `${this.props.postUrl}`
      fetch(endpoint, {
        method: 'post',
        body: JSON.stringify(changerows),
      }).then(response => response.json())
        .then((json) => {
          if (json.data.result === 'success') {
            message.success('保存成功')
            this.setState({
              status: 'normal',
            })

            this.startTimer()
          } else {
            let newrows = this.state.imrows
            let oldrows = fromJS(this.props.tableData.rows)
            // 对修改项增加失败颜色标记
            let colorrows = newrows
            for (let i = 0, l = changerows.length; i < l; i++) {
              for (let key of newrows.get(changerownum[i]).keySeq()) {
                if (newrows.get(changerownum[i]).get(key) !== oldrows.get(changerownum[i]).get(key)) {
                  // console.log(newrows.get(changerownum[i]).get(key));
                  colorrows = colorrows.update(changerownum[i], row => row.update(
key,
                    value => <span style={{ color: '#ff5500' }}>{value}</span>
))
                }
              }
            }
            message.error('保存失败')
            this.setState({
              status: 'error',
              imrows: colorrows,
            })
          }
        }).catch((e) => {
          let newrows = this.state.imrows
          let oldrows = fromJS(this.props.tableData.rows)
          // 对修改项增加失败颜色标记
          let colorrows = newrows
          for (let i = 0, l = changerows.length; i < l; i++) {
            for (let key of newrows.get(changerownum[i]).keySeq()) {
              if (newrows.get(changerownum[i]).get(key) !== oldrows.get(changerownum[i]).get(key)) {
                // console.log(newrows.get(changerownum[i]).get(key));
                colorrows = colorrows.update(changerownum[i], row => row.update(
key,
                  value => <span style={{ color: '#ff5500' }}>{value}</span>
))
              }
            }
          }
          message.error('服务器无响应')
          this.setState({
            status: 'error',
            imrows: colorrows,
          })
        })
    } else {
      // 无提交接口，测试用
      message.success('测试保存成功')

      let status = 'normal'
      // let imrows = fromJS(this.props.tableData.rows);
      this.setState({
        status,
      })
    }
  }

  // 表格内容定义
  filterData (rows, tableData) {
    let editors = this.props.editors
    if (tableData.editors)
      {editors = tableData.editors;}

    let needEditable = this.getNeedEditable(editors)

    let i = 0
    let data = rows.map((srow, rowindex) => {
      // add keys
      let row = {}
      if (this.props.remotePaging === true) {
        row = Object.assign({}, srow, {
          key: `row${(this.state.currentPage - 1) * this.state.pageSize + i++}`, // TODO tableid
        })
      } else {
        row = Object.assign({}, srow, {
          key: `row${rowindex}`, // TODO tableid
        })
      }

      // 对原始数据进行修正
      // for (let key in row) {
      for (let key of tableData.ids) {
        if (React.isValidElement(row[key])) {
          continue
        }

        if (this.props.renderers != null && typeof this.props.renderers[key] === 'function') {
          row[key] = this.props.renderers[key](row, tableData, rowindex)
        } else if (key === 'ROWID') {
          // row.delete(key);
        } else if (row[key] != null && typeof row[key] === 'object') {
          // value is object
          if (row[key].value != null)
            {row[key] = row[key].value;}
          else
            {row[key] = '';}
        }/* else if (key === 'UPDATETIME') {
          let ut = new Date(row[key])
          let devn = (new Date().getTime() - ut.getTime()) / 1000 / 60
          // console.log(ut, devn)
          if (devn > 5)
            row[key] = <span className={styles['label-invalid']}>{row[key]}</span>
        } */
      }

      // 可编辑且在编辑模式
      if (this.props.editable === true && this.state.status === 'edit') {
        for (let j = 0, l = needEditable.length; j < l; j++) {
          if (needEditable[j]) {
            let inputCls = ''
            if (row[tableData.ids[j]] === tableData.rows[rowindex][tableData.ids[j]])
              {inputCls = styles.input;}
            else
              {inputCls = styles['input-edit'];}

            /* 如果使用了 value 表示为受控组件，只能显示 value 的值。如果没有为非受控，使用defaultValue显示初始值 */
            /* 另：如果启用了批量修改同列相同值功能，则需要为受控组件，否则不能实时看到效果 */
            row[tableData.ids[j]] = (<input className={inputCls}
value={row[tableData.ids[j]]}
              onChange={this.inputValueChange.bind(this, tableData.ids[j], rowindex)}
            />)
          }
        }
      }

      // 具有操作项
      if (typeof (this.props.operate) === 'object' && this.props.operate.length > 0) {
        let operate = []
        for (let m = 0, l = this.props.operate.length; m < l; m++) {
          let value
	  if (typeof this.props.operate[m].value !== 'function')
            {value = this.props.operate[m].value;}
          else {
            value = this.props.operate[m].value(row, tableData, rowindex)
  }

	  let name = value
          if (typeof this.props.operate[m].name === 'string')
            {name = this.props.operate[m].name;}
          else if (typeof this.props.operate[m].name === 'function') {
            name = this.props.operate[m].name(row, tableData, rowindex)
          }

          if (m >= 1 && value != null)
            {operate.push(<span className="ant-divider" key={m} />)}

          operate.push(<Tooltip key={name} title={name}>
            <a onClick={this.props.operate[m].event.bind(
this, srow, tableData, rowindex,
              this.formatPageParams(this.getParams())
)}
            >
              {value}
            </a>
          </Tooltip>)
        }

        row = Object.assign({}, row, {
          _operate_: operate,
        })
      }

      return row
    })


    // filter rows
    let filteredData = data
    if (!this.props.remotePaging) {
      filteredData = data.filter((row) => {
        // return row.some( v => v.indexOf(this.state.filterValue) >= 0);
        for (let v in row) {
          if (v === 'key')
            {continue;}

          let tv = typeof row[v]
          // 通用数据过滤
          if ((tv === 'string' || tv === 'number') && (`${row[v]}`).indexOf(this.state.filterValue) >= 0)
            {return true;}
          // 编辑模式下对input进行数据过滤
          if (this.state.status === 'edit' && React.isValidElement(row[v]) &&
          row[v].type === 'input' && row[v].props.value.indexOf(this.state.filterValue) >= 0)
            {return true;}
          // 错误模式下对span进行数据过滤
          if (this.state.status === 'error' && React.isValidElement(row[v]) &&
          row[v].type === 'span' && row[v].props.children.indexOf(this.state.filterValue) >= 0)
            {return true;}
        }

        return false
      })
    }

    return filteredData
  }

  /**
   * 根据外部 props 配置 columns的额外参数。比如 width, fixed
   */
  applyColumnConfig (columns) {
    let columnsConfig = this.props.columnsConfig

    // object
    if (columnsConfig) {
      for (let key in columnsConfig) {
        columns.map((column) => {
          if (column.dataIndex === key) {
            Object.assign(column, columnsConfig[key])
          }

          return column
        })
      }
    }
    // else if(){//array
    // }
  }

  handleTableChange = (pagination, filters, sorter) => {
    if (this.props.remotePaging !== true) {
      this.setState({
        currentPage: pagination.current,
        pageSize: pagination.pageSize,
      })
      return;
    }

    // console.log({pagination,filters,sorter});

    this.stopTimer()

    if (typeof this.props.fetchAction !== 'function')
      {return;}

    // remotePaging 需要更新Table的pagination配置
    let params = {
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      sortField: sorter.field == null ? '' : sorter.field,
      sortOrder: sorter.order == null ? '' : sorter.order,
      search: this.state.filterValue,
    }
    this.setState(params)
    this.setState({ loading: true })

    /*
    // 装配page,sorter,filter参数
    this.params = {
        pageSize: pagination.pageSize,
        currentPage: pagination.current,
        sortField: sorter.field==null?'':sorter.field,
        sortOrder: sorter.order==null?'':sorter.order,
        ...filters
    }
    */

    if (this.props.refreshInterval > 0)
      {this.startTimer(this.props, params);}
    else
      {this.props.fetchAction(this.formatPageParams({...params, ...this.props.queryParams}));}
  }

  formatPageParams (params) {
    let p = { ...params }
    let sort = params.sortField === '' ? '' : params.sortField
    if (sort !== '' && params.sortOrder !== '')
      {sort += `,${params.sortOrder === 'descend' ? 'desc' : 'asc'}`;}

    delete p.currentPage
    delete p.pageSize
    delete p.sortField
    delete p.sortOrder

    p.page = params.currentPage - 1
    p.size = params.pageSize
    p.sort = sort

    return p
  }

  render () {
    if (!this.props.tableData || !this.props.tableData.ids) {
      return (<div className={styles['table-loading']}>
        {/* <Spin /> */}
      </div>)
    }

    let loading = false
    if (this.props.showLoading !== false && (this.props.loading === true || this.state.loading === true))
      {loading = true;}

    const { columns, dataSource, pagination } = this.getTableConfigs(this.props.tableData)

    let onSearch = null
    if (this.props.showQuickFilter !== false)
      {onSearch = this.onQuickFilter;}

    let updateTime = null
    if (this.props.showUpdateTime !== false)
      {updateTime = this.props.updateTime;}

    let pager = false
    if (this.props.showPager !== false)
      {pager = pagination;}

    let immediateSearch = !this.props.remotePaging

    return (<BaseTable {...this.props}
      columns={columns}
      dataSource={dataSource}
      pagination={pager}
      loading={loading}
      onSearch={onSearch}
      updateTime={updateTime}
      title={this.props.title}
      onChange={this.handleTableChange}
      editable={this.props.editable}
      status={this.state.status}
      onEdit={this.editClick}
      onCancel={this.cancelClick}
      onSave={this.saveClick}
      immediateSearch={immediateSearch}
    />)
  }
}

export function getSubmitUrlParams (row, tableData) {
  let editors = this.props.editors
  if (tableData.editors)
    {editors = tableData.editors;}

  if (editors.length > 0) {
    let needSubmit = editors.map((editor) => {
      if (editor && editor.submit === true)
        {return true;}
      return false
    })

    let submitStr = ''
    let isFirst = true
    for (let i in needSubmit) {
      if (needSubmit[i] === true) {
        if (!isFirst)
          {submitStr += '&';}
        else
          {isFirst = false;}

        submitStr += `${tableData.ids[i]}=${encodeURIComponent(row[tableData.ids[i]])}`
      }
    }

    console.log(submitStr)

    return submitStr
  }

  return ''
}
