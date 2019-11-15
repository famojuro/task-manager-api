import express from 'express'
import Task from '../models/task.js'
import auth from '../middleware/auth.js'

const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
        const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        const result = await task.save()
        res.status(201).json({'message': result})
    } catch(e) {
        res.status(400).json({'Failure ': e })
    }
})

router.get('/tasks',auth, async (req, res) => {

      const match = {}
      const sort = {}

      if(req.query.completed) {
          match.completed = req.query.completed === 'true'
      }

      if(req.query.sortBy) {
          const parts = req.query.sortBy.split(':')
          sort[parts[0]] = parts[1] === 'desc' ? -1: 1
      }
    
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.json(req.user.tasks)
    } catch(e) {
        res.status(400).json({"message": e })
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
         const task = await Task.findOne({ _id, owner: req.user._id})

        if(!task){
           return res.status(404).json()
        }
       res.status(200).json({ 'message': task})
    } catch(e) {
        res.status(500).json()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['completed', 'description']
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update)
    )

    if(!isValidOperation) {
        return res.status(400).json({ 'error': 'Invalid updates'})
    }

    const { id } = req.params
    try {
        const task = await Task.findOne({_id: id, owner: req.user._id})

       if(!task) {
           return res.status(404).json()
       }

       updates.forEach((update) => task[update] = req.body[update])

       await task.save()

       res.json(task)
    } catch(e) {
        res.status(400).json({'message': e })
    }

})

router.delete('/tasks/:id', auth, async (req, res)=> {
    const { id } = req.params
    try {
        const task = await Task.findOneAndDelete({_id: id, owner: req.user._id})

        if(!task) {
            return res.status(404).json()
        }

        res.json({'message': task})
    } catch(e) {
        res.status(500).json({'error': e})
    }
})

export default router