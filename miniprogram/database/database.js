module.exports = {
  //获取负责区域列表
  getWorkArea(params){
    return require("./api/getWorkArea.js").api(params);
  },
}