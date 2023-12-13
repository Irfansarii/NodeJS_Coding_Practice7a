const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const app = express()
app.use(express.json())

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log(`Server is running at http://localhost:3000/`)
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

intializeDbAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

// API 1

app.get('/todos/', async (request, response) => {
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  let data = await db.all(getTodosQuery)
  response.send(data)
})

//API 2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let getTodosQuery = `
  SELECT 
  * 
  FROM  
  todo 

  WHERE id = ${todoId}; `

  const todoDetails = await db.get(getTodosQuery)
  response.send(todoDetails)
})

//API - 3

app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status} = todoDetails
  const getTodosQuery = `
  
  INSERT INTO 
  todo (id , todo , priority , status ) 

  VALUES ("${id}", "${todo}", "${priority}", "${status}")  `

  const todoUpdate = await db.run(getTodosQuery)
  //console.lof(todoUpdate)
  response.send('Todo Successfully Added')
})

//API-4

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const updateDetails = ''
  const requestBody = request.body

  switch (true) {
    case requestBody.status !== undefined:
      updateDetails = 'Status'
      break

    case requestBody.priority !== undefined:
      updateDetails = 'Priority'
      break

    case requestBody.todo !== undefined:
      updateDetails = 'Todo'
      break
  }
  const previousUpdateQuery = `
  SELECT 
  * 
  FROM
  todo 

  WHERE 
  id = ${todoId}; `
  const previousUpdate = await db.get(previousUpdateQuery)

  const {
    todo = previousUpdate.todo,
    priority = previousUpdate.priority,
    status = previousUpdate.status,
  } = request.body

  const putUpdateQuery = `
  UPDATE
  todo 
  SET
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}'

  WHERE 

  id = ${todoId}; `

  await db.run(putUpdateQuery)
  response.send(`${updateDetails} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM 
  todo 
  WHERE 
  id = ${todoId}; `

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
