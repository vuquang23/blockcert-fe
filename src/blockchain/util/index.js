async function readFile(jsonCerts) {
    let promises = jsonCerts.map(file => {
        const reader = new FileReader()
        return new Promise(resolve => {
            reader.onload = () => resolve(reader.result)
            reader.readAsText(file, 'utf8')
        })
    })
    return Promise.all(promises)
}


export {
    readFile
}
