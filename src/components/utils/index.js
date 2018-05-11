import lodash from 'lodash'

const isObjectContentEqual = (obj1, obj2) => {
  if (obj1 == null && obj2 == null) { return true }

  if (obj1 == null || obj2 == null) { return false }

  if (Object.getOwnPropertyNames(obj1).length !== Object.getOwnPropertyNames(obj2).length) { return false }

  return lodash.isEqual(obj1, obj2)
}

module.exports = {
  isObjectContentEqual,
}
