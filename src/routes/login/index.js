import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { Button, Row, Form, Input } from 'antd'
import { config } from 'utils'
import styles from './index.less'

const FormItem = Form.Item

class Login extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  handleOk = () => {
    const { validateFieldsAndScroll } = this.props.form
    validateFieldsAndScroll((errors, values) => {
      if (errors) {
        return
      }
      this.props.dispatch({ type: 'login/login', payload: values })
    })
  }
  render () {
    const { getFieldDecorator } = this.props.form
    return (
      <div className={styles.form}>
        <div className={styles.logo}>
          <img alt="logo" src={config.logo} />
          <span>{config.name}</span>
        </div>
        <form>
          <FormItem hasFeedback>
            {getFieldDecorator('username', {
              rules: [
                {
                  required: true,
                  message: '请输入用户名',
                },
              ],
            })(<Input onPressEnter={this.handleOk} placeholder="用户名" />)}
          </FormItem>
          <FormItem hasFeedback>
            {getFieldDecorator('password', {
              rules: [
                {
                  required: true,
                  message: '请输入密码',
                },
              ],
            })(<Input
              type="password"
              onPressEnter={this.handleOk}
              placeholder="密码"
            />)}
          </FormItem>
          <Row>
            <Button
              type="primary"
              onClick={this.handleOk}
              loading={this.props.loading.effects.login}
            >
              登 录
            </Button>
            <p>
              <span style={{ color: 'red' }}>{this.props.login.loginError ? '用户名或密码错误' : ''}</span>
            </p>
          </Row>
        </form>
      </div>
    )
  }
}

Login.propTypes = {
  form: PropTypes.object,
  dispatch: PropTypes.func,
  loading: PropTypes.object,
  login: PropTypes.object,
}

export default connect(({ loading, login }) => ({ loading, login }))(Form.create()(Login))
