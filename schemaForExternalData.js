var pathLoc = 'material'
var fs = require('fs')
var path = require('path')
var { createStorage } = require('./SchemaStorage')
//var chalk = require('chalk')

main()

async function main() {

  let accountName
  if (process.argv && process.argv[2]) {
    accountName = process.argv[2]
  }

  var files = fs.readdirSync(path.resolve(pathLoc))
  var tid = fs.readFileSync('kql/tid.txt').toString()
  var fullSchema = `let home="${tid}"; \n //`
  for await (file of files) {
    var content

    try { content = require(`./${pathLoc}/${file}`).filter(app => app.appDisplayName !== null) } catch (err) {
      /* console.log() */
    }
    //console.log( chalk.yellow('\nschema for', file, '\n' ))
    var schema = `\nlet ${file.split('.json')[0]} = (externaldata (`

    try { delete content[0]['@odata.id'] } catch (error) {
      console.log('different schema')
    }

    var k = Object.keys(content[0])
    k.forEach((key, index) => {

      if (key.match('appDisplayName')) {
        /* console.log() */
      }

      var type = typeof (content[0][key])
      /*        console.log(content[0][key]) */
      if (type == "object") {
        schema += `${key}: dynamic`
      } else {
        schema += `${key}: string`
      }

      if (index !== (k.length - 1)) {
        schema += ", "
      }
    })
    let url = await createStorage(accountName, pathLoc, file, `./${pathLoc}/${file}`)
    schema += `)[@"${url}"] with (format="multijson"));`
    schema += '\n //'
    fullSchema += schema

  }
  /*   let callIt = fs.readFileSync('kql/call.kql').toString() */
  var baseq = fs.readFileSync('kql/query.kql').toString()
  fs.writeFileSync('kql/runtime.kql', fullSchema + baseq)

}



