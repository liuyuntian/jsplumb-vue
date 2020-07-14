export default {
  formIds:[],//表单的id列表
  formMap:{ //以表单的id作为key的表单Map结构
    1:{
      x:100,//表单的x位置
      y:100,//表单的y位置
      fieldIds:[1, 2],//字段id列表
      fieldMap:{//以字段id为key的字段map
        1:{
          id:1, //字段id
          bizId:'column1',//业务id，表字段名
          name:'表一第一列',//字段中文名
          otherAttrs:{ //其它属性中
            targetLines:[{ // 连线都放到起点节点上，数组json结构存储,目标节点连线,支持多个
              lineId:'1_1_2_2_1',// 联系id规则 ${formId}_${fieldId}_${targetFormId}_${targetFieldId}_${lineType};
              lineType:1,// 连线类型 1.关联;2.推送
              //连线规则1：起点是本表字段，终点是他表字段，箭头都指向他表
              //联系规则2：关联连线用实线，推送连线用虚线，连线颜色和样式进行区分
              formId:1,//本表表单id
              fieldId:1,//本表字段id
              targetFormId:2,//目标表单id
              targetFieldId:2,//目标字段id
            }],
          }
        },
        2:{
          id:1, //字段id
          bizId:'column2',//业务id，表字段名
          name:'表一第二列',//字段中文名
          otherAttrs:{ //其它属性中
          }
        },
      },
    },
    2:{
      x:500,//表单的x位置
      y:250,//表单的y位置
      fieldIds:[1, 2],//字段id列表
      fieldMap:{//以字段id为key的字段map
        1:{
          id:1, //字段id
          bizId:'column1',//业务id，表字段名
          name:'第二表第一列',//字段中文名
          otherAttrs:{}
        },
        2:{
          id:1, //字段id
          bizId:'column2',//业务id，表字段名
          name:'第二表第二列',//字段中文名
          otherAttrs:{ //其它属性中
          }
        },
      },
    },
  },
  lineIds:[],//联系id列表,所有字段连线,规则为 ${formId}_${fieldId}_${targetFormId}_${targetFieldId}_${lineType}
}
