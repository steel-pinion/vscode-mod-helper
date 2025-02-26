const schema = require('./modder-schemas.json')
const metadataFields = [
  'KEYWORDS'
]

let keywordHover = {
  ...makeKeywordTipsFromEngineDefs(),
  id: {
    tip: 'Known as "definition id" or `defId`.'
  },
  defId: {
    tip: 'Known as "definition id", identified as just "id" on each mod file.'
  },
  release: {
    tip: 'Engine version at time when this file was added. Has no functional effect beyond tracking.'
  },
  cost: {
    tip: 'How many points are taken from a Fleet Budget.'
  },
  flavor: {
    tip: 'Fun world lore.'
  },
  asset: {
    tip: 'Hints for client visualization.'
  },
  tiny: {
    tip: '5x5 meters'
  },
  small: {
    tip: '10x10 meters'
  },
  medium: {
    tip: '15x15 meters'
  },
  large: {
    tip: '20x20 meters'
  },
  giant: {
    tip: '25x25 meters'
  },
  massive: {
    tip: '30x30 meters'
  },
  system: {
    tip: 'Refers to the type of fuel an engine uses like combustion or solar'
  },
  armor: {
    tip: 'A TArmorLayer[] set which describes how armor breaks off when a ship is hit from various angles'
  },
  ammo: {
    tip: 'How many shots are left for this unit'
  },
  hull: {
    tip: 'Hit points (HP) until this unit is knocked out'
  },
  desc: {
    tip: `# Functional description regarding what this mod is supposed to do.\n# The authors may use certain keywords to trigger useful in-game subtext hints.\n# Present keywords in the base mod are:\n\n${flattenKeywordsByNewlineForListingWithinDesc()}`,
    language: 'yaml'
  },
}

let isSchemaMemoized = false
function findHoverTips(word) {

  if (!isSchemaMemoized) {
    loadModderSchema()
    isSchemaMemoized = true
  }

  return keywordHover[word]
}

function loadModderSchema() {
  for (let concept in schema) {
    if (metadataFields.includes(concept))
      continue

    try {
      let type = schema[concept]
      let tip = schema[concept].tsdoc

      if (!tip) {
        console.log(`using fallback jsonschema tip for ${concept}`)
        tip = `/* ${type.modder} */\n${expandPrefix(concept)} ${concept}${expandSeperator(concept)}${expandValues(type, 1)}`
      }

      if (!keywordHover[type.modKeyword])
        keywordHover[type.modKeyword] = {
          language: 'typescript',
          tip
        }
      else
        keywordHover[type.modKeyword].tip = `${tip}\n\n${keywordHover[type.modKeyword].tip}`

    } catch (err) {
      console.warn(`failed to init tip for ${concept}`)
      console.error(err)
    }
  }
}

function flattenKeywordsByNewlineForListingWithinDesc() {
  return Object.keys(schema.KEYWORDS)
    .sort()
    .map(k => `${k}: ${schema.KEYWORDS[k]}\n`).reduce((a, b) => a + b, '')
}

function makeKeywordTipsFromEngineDefs() {
  let tips = { }
  for (let key in schema.KEYWORDS)
    tips[key] = {
      tip: schema.KEYWORDS[key],
    }
  return tips
}

function expandValues(schema, depth = 0, title = null) {
  let space = '  '.repeat(depth)

  if (schema['$ref'])
    return `${space}${title}: ${schema['$ref'].replace('#/definitions/', '')}`

  if (schema.enum)
    return schema.enum.map(s => `'${s}'`).join(' | ')

  if (schema.type === 'object') {
    let cereal = '{\n'
    let lines = []

    if (schema.properties)
      for (let propName in schema.properties)
        lines.push(expandValues(schema.properties[propName], depth+1, propName))

    if (schema.additionalProperties)
      lines.push(`${space}[name: string]: ${schema.additionalProperties.items?.type || schema.additionalProperties.type}${schema.additionalProperties.items ? '[]': ''}`)

    cereal += `${lines.join('\n')}\n}`
    return cereal
  }

  if (schema.items?.items)
    return `${space}${title}: [${schema.items.items.map(i => expandValues(i)).join(', ')}]`

  if (schema.type === 'array')
    return `${space}${schema.items?.type || schema.type}[]`

  if (!title)
    return `${space}${schema.type}`

  return `${space}${title}: ${schema.type}`
}

function expandPrefix(typeName) {
  return typeName[0] === 'I'
    ? 'interface'
    : 'type'
}

function expandSeperator(typeName) {
  return typeName[0] === 'I'
    ? ' '
    : ' = '
}

module.exports = {
  findHoverTips
}
