const cloud = require('wx-server-sdk')
cloud.init()
const db=cloud.database();
const _ = db.command
const todo = db.collection('todo');
exports.main = async (event, context) => {
  var now = new Date().toString();
  var arr = now.split(' ');
  var m = arr[4].split(':');
  var date = new Date(new Date().toLocaleDateString()).getTime();
  // console.log(new Date(new Date().toLocaleDateString()))
  var time = parseInt(m[0]) * 60 * 60 * 1000;
  time += parseInt(m[1]) * 60 * 1000;
  var now = date + time;
  console.log('now',now)
  let res = await todo.where({ 
    time: now,
    state:false,
    notice:true
  }).get();
  console.log('推送列表———————————————————',res)
  let list = res.data; 
  list.map(async item=>{
    console.log('item-----------------',item)
    try {
      const result = await cloud.openapi.subscribeMessage.send({
        touser:item._openid, // 通过 getWXContext 获取 OPENID
        templateId:'V4LlPMNc9TkCADvO59W7Qo4noLCpTqyzwZPIv7HYZHQ',
        page:'pages/home/home/home', 
        data:{
          thing3: {//任务名称
            value: item.title,
          },
          thing6: {//任务内容 
            value: item.note==''?'（无备注）':item.note,
          },
        }
        // miniprogram_state:'trial'
      })
      console.log('推送成功——————————————————',result)
      return result
    } catch (err) {
      console.log('推送失败——————————————————',err)
      return err
    }
  })
  return '结束'
}