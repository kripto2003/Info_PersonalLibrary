/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const expect = require('chai').expect;
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/books')
    .get((req, res)=>{
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db)=> {
        expect(err, 'database error').to.not.exist;
        const collection = db.collection('books');
        collection.find().toArray((err, result)=> {
          expect(err, 'database find error').to.not.exist;
          expect(result).to.exist;
          expect(result).to.be.a('array');
          for(var i=0;i<result.length;i++) {
            result[i].commentcount = result[i].comments.length;
            delete result[i].comments;
          }
          res.json(result);
        });
      });
    })
    .post((req, res)=>{
      //response will contain new book object including atleast _id and title
      const title = req.body.title;
      if(!title) { res.send('missing title'); }
      else {
        expect(title, 'posted title').to.be.a('string');
        MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db)=> {
          expect(err, 'database error').to.not.exist;
          const collection = db.collection('books');
          const doc = {title:title, comments:[]};
          collection.insert(doc, {w:1}, (err, result)=> {
            expect(err, 'database insert error').to.not.exist;
            res.json(result.ops[0]);
          });
        });
      }
    })
    .delete((req, res)=>{
      //if successful response will be 'complete delete successful'
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db)=> {
        expect(err, 'database error').to.not.exist;
        const collection = db.collection('books');
        collection.remove();
        res.send("complete delete successful");
      });
    });

  app.route('/api/books/:id')
    .get((req, res)=>{
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      const bookid = req.params.id;
      //expect(bookid).to.have.lengthOf(24);
      const oid = new ObjectId(bookid); //Must convert to mongo object id to search by it in db
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db)=> {
        expect(err, 'database error').to.not.exist;
        const collection = db.collection('books');
        collection.find({_id:oid}).toArray((err, result)=> {
          expect(err, 'database find error').to.not.exist;
          if(result.length === 0) {res.send('no book exists');} else {res.json(result[0]);}
        });
      });
    })
    .post((req, res)=>{
      //json res format same as .get
      const bookid = req.params.id;
      const oid = new ObjectId(bookid); //Must convert to mongo object id to search by it in db
      const comment = req.body.comment;
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db)=> {
        expect(err, 'database error').to.not.exist;
        const collection = db.collection('books');
        collection.findAndModify(
          {_id: oid},
          {},
          {$push: { comments: comment }},
          {new: true, upsert: false},
          (err, result)=>{
            expect(err, 'database findAndModify error').to.not.exist;
            res.json(result.value);
          });
      });
    })
    .delete((req, res)=>{
      //if successful response will be 'delete successful'
      const bookid = req.params.id;
      const oid = new ObjectId(bookid); //Must convert to mongo object id to search by it in db
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db)=> {
        expect(err, 'database error').to.not.exist;
        const collection = db.collection('books');
        collection.findOneAndDelete({_id:oid}, (err, result)=> {
          expect(err, 'database findOneAndDelete error').to.not.exist;
          expect(result, 'result error').to.exist;
          res.send("delete successful");
        });
      });
    });
  
};
