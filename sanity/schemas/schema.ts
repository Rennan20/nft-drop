import {createSchema} from 'sanity'

import { schemaTypes } from '.'
import collection from './collection'
import creator from './creator'

export default createSchema({
  name: 'default',

  types: schemaTypes.concat([collection, creator]),
})
