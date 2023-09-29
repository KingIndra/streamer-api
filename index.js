const express = require('express')
const jwt = require('jsonwebtoken')
const fs = require('fs')

const app = express()
app.use(express.json())


// 
const secret = "secret"

app.get('/sign', (req, res) => {
    const {user} = req.body
    const iat = 60*60*24*7
    const token = jwt.sign({ user, iat }, secret)
    res.json({ user, token })
})

app.get('/verify', (req, res) => {
    const {token} = req.body
    const {username} = jwt.verify(token, secret)
    res.json(username)
})
// 


const videoFileMap = {
    'cdn':'videos/cdn.mp4',
    'generate-pass':'videos/generate-pass.mp4',
    'get-post':'videos/get-post.mp4',
}

app.get('/videos/:token', (req, res)=>{
    const token = req.params.token
    if(token) {
        try {
            const {username, name} = jwt.verify(token, secret)
            console.log(username, name)
        } catch(error) {
            console.log("invalid token")
        }
    }
    const fileName = "cdn"
    const filePath = videoFileMap[fileName]
    if(!filePath){
        return res.status(404).send('File not found')
    }
    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = req.headers.range

    if(range){
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

        const chunksize = end - start + 1
        const file = fs.createReadStream(filePath, {start, end})
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4'
        }
        res.writeHead(206, head)
        file.pipe(res)
    }
    else{
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4'
        }
        res.writeHead(200, head)
        fs.createReadStream(filePath).pipe(res)
    }
})

app.listen(4000, ()=>{
    console.log('server is listening on post 4000')
})