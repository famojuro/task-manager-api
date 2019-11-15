import express from 'express'
import User from '../models/user.js'
import auth from '../middleware/auth.js'
import multer from 'multer'
import sharp from 'sharp'
import { sendWelcomeEmail, sendCancelEmail} from '../emails/account.js'

const router = new express.Router()

router.post('/users', async(req, res)=> {
    const { name, password, email} = req.body
    try {
    const user = new User({
        name,
        password,
        email
    })
    const result = await user.save()
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken()
    res.status(201).json({ 'message': result, token})
} catch(e) {
   res.status(400).json({ 'Failure ': e })
}

})

router.post('/users/login', async(req, res)=> {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
         res.json({user, token})
    } catch(e) {
        res.status(400).json()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).json()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).json()
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
            return cb(new Error('Please upload image'))
       }
       cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
     const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer()
     req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next)=> {
    res.status(400).json({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    const { id } = req.params
    try {
        const user = await User.findById({_id:id})
        if(!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch(e) {
        res.status(404).json()
    }
})
 
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})


router.patch('/users/me',auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update)
    )

    if(!isValidOperation) {
        return res.status(400).json({ 'error': 'Invalid updates'})
    }
    try {
        const {id} = req.user._id
   
         updates.forEach((update) => req.user[update] = req.body[update])

         await req.user.save()

        res.json(req.user)
    } catch(e) {
        res.status(500).json(e)
    }
})

router.delete('/users/me', auth, async (req, res)=> {
    try {
        await req.user.remove()
        sendCancelEmail(req.user.email, req.user.name)
        res.json({'message': req.user})
    } catch(e) {
        res.status(500).json()
    }
})

export  default router