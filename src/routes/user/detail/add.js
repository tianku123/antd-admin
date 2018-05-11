import React from 'react'
import qs from 'qs'
import PropTypes from 'prop-types'
import { Form, Input, Button, Col, Select, message, Row } from 'antd'
import Icon from 'react-fontawesome'
import { config, dateTimeFormat, utils } from '../../../utils'
import axios from 'axios'
import { routerRedux } from 'dva/router'
import { connect } from 'dva'
import styles from './styles.less'
import Card from './HCard'

const FormItem = Form.Item
const Option = Select.Option
/**
 * @author yl
 */
class BondRateAdd extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
    }
    this.bindTotal = {}
    this.fileList = []
    this.time = ''
    this.id = null
    this.addSum = 0
  }

  onChangeData = (data) => {
    this.bindTotal = data
    this.props.form.setFieldsValue({ bondType: data.secucategory })
  }

  onChangeFile = (file) => {
    this.fileList = file.fileList
  }
  // 保存,提交
  save = (postStatus) => {
    if (this.addSum === 1) {
      this.addSum++
      return
    }
    // 新增
    if (!this.props.rateForm.bondId) {
      if (!this.bindTotal.tradingcode) {
        message.error('请选择债券代码!')
        return
      }
    }
    let fileIds = ''
    this.fileList.forEach(obj => fileIds = `${fileIds}${obj.uid},`)
    this.props.form.validateFields((err, values) => {
      if (!err) {
        values.bondId = this.bindTotal.tradingcode
        values.postStatus = postStatus
        values.attachmentId = fileIds.substring(0, fileIds.length - 1)
        this.id = (!this.props.rateForm.id) ? this.id : this.props.rateForm.id
        // 新增
        if (!this.id) {
          // add 新增页面
          axios.post(`${config.API_ROOT}/bond/bondRate`, qs.stringify(values))
            .then(response => response.data)
            .then((json) => {
              this.addSum = 0
              if (json.status === 0) {
                message.success('操作成功!')
                if (postStatus === 1) {
                  this.props.dispatch(routerRedux.push({
                    pathname: '/bond/rate',
                  }))
                } else {
                  this.id = json.data.id
                  this.props.form.setFieldsValue({ rateTime: dateTimeFormat(json.data.rateTime) })
                }
              } else {
                message.error(json.message)
              }
            })
        } else {
          // edit 编辑页面
          values.id = (!this.props.rateForm.id) ? this.id : this.props.rateForm.id
          axios.put(`${config.API_ROOT}/bond/bondRate`, qs.stringify(values))
            .then(response => response.data)
            .then((json) => {
              this.addSum = 0
              if (json.status === 0) {
                message.success('操作成功!')
                if (postStatus === 1) {
                  this.props.dispatch(routerRedux.push({
                    pathname: '/bond/rate',
                  }))
                } else {
                  this.props.form.setFieldsValue({ rateTime: dateTimeFormat(json.data.rateTime) })
                }
              } else {
                message.error(json.message)
              }
            })
        }
      }
    })
  }

  cancel = () => {
    this.props.dispatch(routerRedux.push({
      pathname: '/bond/rate',
    }))
  }

  render () {
    const { form } = this.props
    const { getFieldDecorator } = form
    let addOrEdit = true
    let addOrEditDetail = false
    let addOrEditTitle = ''
    let rateOptionsArr = []
    if (this.props.detail === 'detail') {
      addOrEditDetail = true
    }
    if (!this.props.rateForm.bondId) {
      addOrEdit = false
    }
    if (!this.props.rateForm.bondId) {
      addOrEditTitle = (
        <Row className={styles.addTitleStyle}>
          <Col span="22" offset="1">
            新增债券评级
          </Col>
        </Row>)
    } else if (addOrEditDetail) {
      addOrEditTitle = (
          <Row className={styles.addTitleStyle}>
            <Col span="22" offset="1">
              查看债券评级
            </Col>
          </Row>)
      } else {
      addOrEditTitle = (
          <Row className={styles.addTitleStyle}>
            <Col span="22" offset="1">
              编辑债券评级
            </Col>
          </Row>)
      }
    if (config.insideRateDict) {
      for (let v of config.insideRateDict.values()) {
        rateOptionsArr.push(<Option value={v}>{v}</Option>)
      }
    }
    return (<div>
      <Card title={addOrEditTitle} className="defaultAdd" collapsible={Boolean(false)}>
        <Form layout="horizontal" className={styles.resetAntFormStyle}>
          <FormItem className={styles.addMarginBottom}>
            <Col xs={24} sm={4} md={4} lg={4} xl={4} />

            {addOrEdit && (
              <div>
                <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                  <FormItem label="债券代码" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                    <Input placeholder="" disabled={Boolean(true)} value={this.props.rateForm.bondId} />
                  </FormItem>
                </Col>
                <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                  <FormItem label="债券名称" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                    <Input placeholder="" disabled={Boolean(true)} value={this.props.rateForm.bondName} />
                  </FormItem>
                </Col>
              </div>
            )}
            <Col xs={24} sm={4} md={4} lg={4} xl={4} />
          </FormItem>
          <FormItem className={styles.addMarginBottom}>
            <Col sm={4} md={4} lg={4} xl={4} />
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <FormItem label="债券类型" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                {getFieldDecorator('bondType', {
                  initialValue: this.props.rateForm.bondType,
                  rules: [{
                  }],
                })(<Input placeholder="" disabled={Boolean(true)} />)}
              </FormItem>
            </Col>
            <Col sm={8} md={8} lg={8} xl={8}>
              <FormItem label="评级人员" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                {getFieldDecorator('rateStaff', {
                  initialValue: this.props.rateForm.rateStaff ? this.props.rateForm.rateStaff : this.props.user.name,
                  rules: [{
                    required: true, message: '请输入评级人员!',
                  }],
                })(<Input placeholder="" disabled={Boolean(true)} />)}
              </FormItem>
            </Col>
            <Col sm={4} md={4} lg={4} xl={4} />
          </FormItem>
          <FormItem className={styles.addMarginBottomDate}>
            <Col sm={4} md={4} lg={4} xl={4} />
            <Col sm={8} md={8} lg={8} xl={8}>
              <FormItem label="评级时间" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                {getFieldDecorator('rateTime', {
                  initialValue: this.props.rateForm.rateTime ? dateTimeFormat(this.props.rateForm.rateTime) : dateTimeFormat((new Date()).getTime()),
                  rules: [{
                  }],
                })(<Input placeholder="" disabled={Boolean(true)} />)}
              </FormItem>
            </Col>
            <Col sm={8} md={8} lg={8} xl={8}>
              <FormItem label="内部评级" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                {getFieldDecorator('internalRate', {
                  initialValue: this.props.rateForm.internalRate,
                  rules: [{
                    required: true, message: '请选择内部评级!',
                  }],
                })(<Select disabled={addOrEditDetail ? Boolean(true) : Boolean(false)}>
                  {rateOptionsArr}
                </Select>)}
              </FormItem>
            </Col>
            <Col sm={4} md={4} lg={4} xl={4} />
          </FormItem>
          <FormItem className={styles.addMarginBottom}>
            <Col sm={4} md={4} lg={4} xl={4} />
            <Col sm={16} md={16} lg={16} xl={16}>
              <FormItem label="评级观点" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
                {getFieldDecorator('rateView', {
                  initialValue: this.props.rateForm.rateView,
                  rules: [{
                    required: true, message: '请输入评级观点!',
                  }],
                })(<Input disabled={addOrEditDetail ? Boolean(true) : Boolean(false)} type="textarea" rows={4} style={{ minHeight: '250px' }} />)}
              </FormItem>
            </Col>
          </FormItem>
          <FormItem className={styles.addMarginBottom}>
            <Col sm={16} md={16} lg={16} xl={16} offset="4" />
            <Col sm={4} md={4} lg={4} xl={4} />
          </FormItem>
          <FormItem className={styles.addMarginBottomButton}>
            <Col sm={9} md={9} lg={9} xl={9} />
            <Col sm={12} md={12} lg={12} xl={12}>
              <Button type="primary" onClick={this.save.bind(this, 0)} style={{ visibility: addOrEditDetail ? 'hidden' : '' }}>
                <Icon name="save" style={{ marginRight: 5 }} />
                保存
              </Button>
              <Button type="primary" onClick={this.save.bind(this, 1)} style={{ visibility: addOrEditDetail ? 'hidden' : '' }}>
                <Icon name="check-circle" style={{ marginRight: 5 }} />
                提交
              </Button>
              <Button type="primary" onClick={this.cancel}>
                <Icon name="reply" style={{ marginRight: 5 }} />
                返回
              </Button>
            </Col>
            <Col sm={3} md={3} lg={3} xl={3} />
          </FormItem>
        </Form>
      </Card>
    </div>)
  }
}

BondRateAdd.propTypes = {
  dispatch: PropTypes.func,
  form: PropTypes.object.isRequired,
  rateForm: PropTypes.object,
  user: PropTypes.object,
  detail: PropTypes.string,
}

let BondRateAddForm = Form.create({
})(BondRateAdd)

export default connect(({ bond, app }) => ({
  rateForm: bond.rateForm,
  user: app.user,
  detail: bond.detail,
}))(BondRateAddForm)
