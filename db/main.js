const parser = require('xml2js')
const fs = require('fs')

function buildDbJsonData (input) {
  const db = {
    yearContents: {},
  }

  db.yearList = input.plist.dict[0].key.flatMap((value, index) => {
    const yearTitle = value.substr(4)
    // yearlyContent.messageList = input.plist.dict[0].dict[index].key.flatMap((value, index) => {
    //
    //   const messageTitle = value.substr(4)
    //
    //   const messageContent = {}
    //   messageContent.weekList = input.plist.dict[0].dict[index].dict[index].key.flatMap((value, index) => {
    //     const weekTitle = value.substr(4)
    //     return weekTitle
    //   })
    //
    //   return messageTitle
    // })

    db.yearContents[yearTitle] = buildYearlyContent(input.plist.dict[0].dict[index])

    return yearTitle
  })

  // db.messages.content = {}
  // for (let i = 0; i < db.messages.key.length; i++) {
  //   db.messages.content[db.messages.key[i]] = input.plist.dict[0].dict[0].dict[i]
  // }
  return db
}

function buildYearlyContent (dict) {
  const content = {
    messageContents: {},
  }
  content.messageList = dict.key.flatMap((value, index) => {
    const messageTitle = value.substr(4)
    content.messageContents[messageTitle] = buildMessageContents(dict.dict[index])
    return messageTitle
  })

  return content
}

function buildMessageContents (dict) {
  const content = {
    weeklyContents: {},
  }

  content.weekList = dict.key.flatMap((value, index) => {
    const weekTitle = value.substr(4)
    content.weeklyContents[weekTitle] = buildWeekContent(dict.array[index].array)
    return weekTitle
  })
  return content
}

function buildWeekContent (dataList) {
  if (!dataList) {
    return []
  }

  return dataList.flatMap((value, index) => {
    const title = value.string[0].substr(4)
    const link = value.string[1]
      .substr(4)
      .replace('SERVERIP2', 'ezoecloud.twgbr.org')
      .replace('http', 'https')
    return {
      title: title,
      link: link,
    }
  })
}

fs.readFile(
  './data.xml',
  { encoding: 'utf8' },
  (err, data) => {
    if (err) {
      return console.error(err.toString())
    }

    parser.parseString(data, (err, result) => {
      if (err) {
        return console.error(err.toString())
      }

      const dbJsonData = buildDbJsonData(result)

      fs.writeFile('../src/components/db.json', JSON.stringify(dbJsonData, null, 2), err => {
        if (err) {
          console.error(err)
        } else {
          // file written successfully
        }
      })
    })
  })
