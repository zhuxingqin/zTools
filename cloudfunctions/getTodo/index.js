// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db=cloud.database();
const _ = db.command
const todo = db.collection('todo');
const workArea = db.collection('workArea');

// 云函数入口函数
exports.main = async (event, context) => {
  let result = {};
  console.log('type___________',event.type)
  console.log('event___________',event)
  let type = event.type;
  let workAreaList = [];
  async function getlist(){
    var time = 0;
    if(type == 'today'){
      time = _.and(_.gte(parseInt(event.data.time[0])),_.lt(parseInt(event.data.time[1])));
    }else if(type == 'anyTime'){
      time = _.lt(parseInt(event.data.time));
    }else if(type == 'someDay'){
      time = _.nor(_.eq(0), _.lt(parseInt(event.data.time)));
    }
    console.log('time_____________',time)
    result.total = await todo.where(_.or([{
      _openid: event.data.openid,
      state: event.data.state,
      time
    },{
      partners:event.data.openid,
      state: event.data.state,
      time
    }])).count().then(res=>{
      return res.total
    }).catch(console.error)
    result.todoList = await todo.where(_.or([{
      _openid: event.data.openid,
      state: event.data.state,
      time
    },{
      partners:event.data.openid,
      state: event.data.state,
      time
    }]))
    .skip(event.data.skip)
    .limit(event.data.limit)
    .orderBy(event.data.orderBy.name, event.data.orderBy.type)
    .get()
    .then(res=>{
      return res.data
    }).catch(console.error)
    return result
  }
  if(type == 'today' || type == 'anyTime' || type == 'someDay'){
    return getlist();
  }else if(type == 'share'){
    let total = await todo.where({
      partners:event.data.openid,
    })
    .count()
    .then(res=>{
      console.log(res)
      return res.total
    })
    .catch(console.error)
    if(total==0){
      result.todoList = await todo.where({
        _id:event.data.id
      })
      .get()
      .then(res=>{
        return res.data
      }).catch(console.error)
    }else{
      result.state ={
        msg:'该分享已存在',
        code:'-1'
      }
    }
  }else if(type == 'jionShare'){
    workAreaList = await workArea.where({
      _openid:event.data.openid
    })
    .get()
    .then(res=>{
      console.log(res)
      return res.data
    })
    .catch(console.error)
    let workAreaId = null;
    console.log('workAreaList_______________',workAreaList)
    workAreaList.map(item=>{
      if(item.name == '协作'){
        workAreaId = item._id
        return
      }
    })
    if(workAreaId == null){
      await workArea.add({
        data:{
          _openid:event.data.openid,
          name:'协作',
          sort:workAreaList.length + 1
        }
      })
      .then(res=>{
        return res
        console.log(res)
      })
      .catch(console.error)
    }
    result.todoList = await todo.doc(event.data.id).update({
      data:{
        partners:_.push([event.data.openid])
      }
    })
    .then(res=>{
      return res
    })
    .catch(console.error)
  }
  console.log('result_____________',result)
  return result
}