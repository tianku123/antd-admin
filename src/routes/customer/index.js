import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { Button, Row, Form, Input } from 'antd'
import { config } from 'utils'
import styles from './index.less'

const FormItem = Form.Item

class Customer extends React.Component {
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
    return (
      <div className={styles.form}>
        咳咳咳咳咳咳咳
      </div>
    )
  }
}

Customer.propTypes = {
  form: PropTypes.object,
  dispatch: PropTypes.func,
  customer: PropTypes.object,
}

export default connect(({ customer }) => ({ customer }))
