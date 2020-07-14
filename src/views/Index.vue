<template>
    <div id="drawDiv" @mousemove="moveMouse($event)" style="height: 100%;">
        <div>
            <div style="padding: 10px 20px; text-align: center; background: #cccccc;color: #000;width: 100px; cursor: pointer"
                 @click="refresh">恢复默认
            </div>
            <el-button @click="createDiv">新建</el-button>
        </div>
        <div class="panel-body points demo flow_chart" id="points" style="height: 80%;">

        </div>
        <el-dialog
                title="修改表属性"
                :visible.sync="dialogVisible">
            <el-form v-model="tableForm">
                <el-form-item label="表名：">
                    <el-input disabled v-model="tableForm.name"></el-input>
                </el-form-item>
                <el-form-item label="Code：">
                    <el-input disabled v-model="tableForm.code"></el-input>
                </el-form-item>
            </el-form>
            <el-form ref="form" :model="currentParam">
                <el-form-item label="字段名：">
                    <el-input v-model="currentParam.name"></el-input>
                </el-form-item>
                <el-form-item label="code：">
                    <el-input v-model="currentParam.code"></el-input>
                </el-form-item>
                <el-form-item label="类型：">
                    <el-select v-model="currentParam.dataType" label-in-value="true" placeholder="请选择类型"
                               @on-change="getSelectedValue">
                        <el-option
                                v-for="o in options"
                                :key="o.value"
                                :label="o.label"
                                :value="o.value">
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="cancel">取 消</el-button>
                <el-button type="primary" @click="editOk">确 定</el-button>
            </div>
        </el-dialog>
        <el-dialog
                title="修改表名"
                :visible.sync="editVisible"
                width="30%">
            <el-form ref="tableForm" :model="tableForm" label-width="60" :rules="ruleInline">
                <el-form-item prop="name" label="表名：">
                    <el-input v-model="tableForm.name"/>
                </el-form-item>
                <el-form-item prop="code" label="Code：">
                    <el-input :disabled="newNodeEvent == null" v-model="tableForm.code"/>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="editCancel">取 消</el-button>
                <el-button type="primary" @click="tableChange">确 定</el-button>
            </div>
        </el-dialog>
    </div>

</template>

<script>
  import myData from '../assets/data1.js';
  import 'element-ui/lib/theme-chalk/index.css';
  require('../assets/css/demo.css');
  require('../assets/css/jsplumb.css');

  export default {
    components: {},
    name: 'Index',
    data(){
      return {
        ruleInline: {
          user: [
            { required: true, message: '请填写表名', trigger: 'blur' },
          ],
          password: [
            { required: true, message: '请填写Code', trigger: 'blur' },
          ],
        },
        lastParam: {}, // 编辑之前的字段
        currentParam: {}, // 正在编辑的字段
        currentParamIndex: null, // 选中的字段索引
        overlay: null,
        options: [{
          value: 0,
          label: 'Int',
        }, {
          value: 1,
          label: 'BigInt',
        }, {
          value: 2,
          label: 'TinyInt',
        }, {
          value: 3,
          label: 'Money',
        }, {
          value: 4,
          label: 'Varchar',
        }, {
          value: 5,
          label: 'VarcharMax',
        }, {
          value: 6,
          label: 'Nvarchar',
        }, {
          value: 7,
          label: 'NvarcharMax',
        }, {
          value: 8,
          label: 'Guid',
        }, {
          value: 9,
          label: 'Bool',
        }, {
          value: 10,
          label: 'DateTime',
        }, {
          value: 11,
          label: 'DateTime2',
        }, {
          value: 12,
          label: 'Decimal',
        }, {
          value: 50,
          label: 'Computed',
        }, {
          value: 80,
          label: 'Function',
        }, {
          value: 100,
          label: 'Object',
        }, {
          value: 200,
          label: 'Array',
        }],
        newElements: null,
        newNodeEvent: null,
        isDragging: false,
        instance: {},
        currentTable: null,
        tableForm: {
          columns: [],
        },   // 正在编辑的表格
        currentItem: 0,
        currentInput: null,
        editVisible: false,
        dialogVisible: false,
        data: {},
      };
    },
    created(){
      this.data = myData;
    },
    methods: {
      getSelectedValue(g){
        this.currentParam.dataType = g.value;
        this.currentParam.dataTypeText = g.label;
      },
      editOk(){
        this.data.schemes[this.currentItem].columns[this.currentParamIndex] = this.currentParam;
        $('#' + this.data.schemes[this.currentItem].code + '-' + this.data.schemes[this.currentItem].columns[this.currentParamIndex].code).find('.param-name').html(this.currentParam.name + '(' + this.currentParam.dataTypeText + ')');
        this.dialogVisible = false;
      },
      editCancel(){
        this.editVisible = false;
        this.tableForm = {};
      },
      tableChange(){
        this.editVisible = false;
        this.$refs.tableForm.validate((valid) => {
          if (valid){
            this.$Message.success('修改成功!');
            this.data.schemes[this.currentItem].name = this.tableForm.name;
            this.data.schemes[this.currentItem].code = this.tableForm.code;
          }else{
            this.$Message.error('修改失败，请正确完善信息！');
          }
        });
        console.log(this.data.schemes);
      },
      cancel(){
        this.dialogVisible = false;
      },
      newConfirm(){
        const vm = this;
        for (const i of this.data.schemes){
          if (vm.tableForm.code === i.code){
            this.$message('表的Code不能重复！');
            return;
          }
        }
        $('.points').append(
          `<div id="${vm.tableForm.code}" class="point">
              <div style="padding:0.5em 0.5em; cursor:default; background: #acd; display: flex; justify-content: space-between"><i class="click-point el-icon-edit"></i><span class="name-change" style="font-size: 12px;height: 20px;line-height: 20px">${vm.tableForm.name}</span><i class="delete-show ivu-icon-ios-close"></i></div>
              <div class="add-content"></div>
               </div>`,
        );
        $('#' + vm.tableForm.code).css('left', 0);
        $('#' + vm.tableForm.code).css('top', 0);
        $('.click-point').bind('click', function (e){
          vm.dialogVisible = true;
          vm.currentTable = e.target.parentNode.parentNode.id;
          console.log(vm.currentTable);
        })
        $('.delete-show').bind('click', function (){

        });
        vm.currentTable = vm.tableForm.code;
        $('#' + vm.currentTable).find('.name-change').html(vm.tableForm.name)
        $('#' + vm.currentTable).find('.add-content').empty();
        vm.instance.removeAllEndpoints($('#' + vm.currentTable).attr('id'));
        // 编辑的数据和点
        for (const i of vm.tableForm.columns){
          $('#' + vm.currentTable).find('.add-content').append(`<div id="${vm.currentTable + ' ' + i.code}" class="param-name" style="padding: 0 0.8em;border-top: 1px solid #cccccc; font-size: 12px">${i.name}</div>`);
          vm.instance.addEndpoint(vm.currentTable + ' ' + i.code, {
            uuid: `${vm.currentTable + ' ' + i.code}-left`,
            anchor: 'Left',
            maxConnections: -1,
            connectorStyle: { stroke: 'green' },
          }, {
            isSource: true,
            isTarget: true,
            dragAllowedWhenFull: true,
          });
          vm.instance.addEndpoint(vm.currentTable + ' ' + i.code, {
            uuid: `${vm.currentTable + ' ' + i.code}-right`,
            anchor: 'Right',
            maxConnections: -1,
            // connectorStyle: { stroke: 'gray' },
          }, {
            isSource: true,
            isTarget: true,
            dragAllowedWhenFull: true,
          });
        }
        // 添加进数据
        vm.data.schemes.push(vm.tableForm)
        vm.dialogVisible = false;
        vm.instance.draggable(`${vm.tableForm.code}`);
        vm.isDragging = false;
        vm.newNodeEvent = null;
        vm.tableForm = {
          columns: [],
        };
      },
      createDiv(){
        this.newNodeEvent = true;
        this.dialogVisible = true;
      },
      moveMouse(event){
        if (this.isDragging === true){
          this.newElements.style.left = event.offsetX;
          this.newElements.style.top = event.offsetY;
          console.log(event.offsetX + ',' + event.offsetY);
        }
      },
      addParam(){
        const vm = this;
        if (this.newNodeEvent === null){
          vm.dialogVisible = false;
          $('#' + vm.currentTable).find('.name-change').html(vm.tableForm.name)
          $('#' + vm.currentTable).find('.add-content').empty();
          vm.instance.removeAllEndpoints($('#' + vm.currentTable).attr('id'));
          // 编辑的数据和点
          for (const i of vm.tableForm.columns){
            $('#' + vm.tableForm.code).find('.add-content').append(`<div style="border-top: 1px solid #cccccc;display: flex;padding: 0 0.8em; justify-content: space-between" id="${vm.tableForm.code + '-' + i.code}"><div class="param-name" style="font-size: 12px">${i.name}(${i.dataTypeText})</div><div><span style="cursor: pointer; margin-right: 10px">🖊</span><span style="cursor: pointer">×</span></div></div>`);
            vm.instance.addEndpoint(vm.currentTable + ' ' + i.code, {
              uuid: `${vm.currentTable + '-' + i.code}-left`,
              anchor: 'Left',
              maxConnections: -1,
              connectorStyle: { stroke: '#61B7CF' },
            }, {
              isSource: true,
              isTarget: true,
              dragAllowedWhenFull: true,
            });
            vm.instance.addEndpoint(vm.currentTable + '-' + i.code, {
              uuid: `${vm.currentTable + '-' + i.code}-right`,
              anchor: 'Right',
              maxConnections: -1,
              connectorStyle: { stroke: '#61B7CF' },
            }, {
              isSource: true,
              isTarget: true,
              dragAllowedWhenFull: true,
            });
          }
          for (const i of vm.data.line){
            if (i[0] === vm.currentTable){
              const uuid = [`${i[0]}-bottom`, `${i[1]}-top`];
              vm.instance.connect({
                uuids: uuid,
                overlays,
              });
            }else if (i[1] === vm.currentTable){
              const uuid = [`${i[0]}-bottom`, `${i[1]}-top`];
              vm.instance.connect({
                uuids: uuid,
                overlays,
              });
            }
          }
        }else{
          vm.newConfirm();
        }
      },
      // 增加字段项
      addColumns(){
        const obj = {
          id: '',
          name: '',
          code: '',
          dataType: null,
          dataTypeText: '',
          relationCode: '',
        };
        this.tableForm.columns.push(obj);
      },
      deleteColumns(index){
        this.tableForm.columns.splice(index, 1);
      },
      createFlow(){
        var vm = this;
        const color = '#409EFF';
        window.s = vm.instance = jsPlumb.getInstance({
          // notice the 'curviness' argument to this Bezier curve.
          // the curves on this page are far smoother
          // than the curves on the first demo, which use the default curviness value.
          Connector: ['Flowchart', { curviness: 50 }],
          Endpoint: ['Dot', { radius: 12 }],
          DragOptions: { cursor: 'pointer', zIndex: 5000 },
          PaintStyle: { lineWidth: 5, stroke: color},
          EndpointStyle: { radius: 5, fill: color, stroke: color },
          HoverPaintStyle: { stroke: '#66b1ff', lineWidth: 4 },
          EndpointHoverStyle: { fill: '#66b1ff', stroke: '#66b1ff' },
          deleteEndpointsOnDetach: false,
          ConnectionOverlays: [
            ['Arrow', {
              width: 10,
              length: 10,
              location: 1,
            }],
            ['Arrow', {
              width: 10,
              length: 10,
              location: 0.2,
            }],
            ['Arrow', {
              width: 10,
              length: 10,
              location: 0.7,
            }],
            ['Label', {
              label: '',
              cssClass: '',
              labelStyle: {
                color: 'red',
              },
            }],
          ],
          Container: 'points',
        });
        // suspend drawing and initialise.
        vm.instance.batch(() => {
          // declare some common values:
          const arrowCommon = { foldback: 0.7, width: 12 };
          // use three-arg spec to create two different arrows with the common values:
          let overlays = [
            ['Arrow', { location: 0.7 }, arrowCommon],
            ['Label', { label: '1', id: 'label-1', location: 0.1 }],
            ['Label', { label: 'N', id: 'label-n', location: 0.9 }],
          ];
          // init point
          for (const point in vm.data.formMap){
            $('.points').append(
              `<div id="${point}" class="point">
              <div style="padding:0 0.5em; background: #409EFF; cursor: default; display: flex; justify-content: space-between"><span class="click-point">⚙</span><span class="name-change" style="font-size: 12px;">${point}</span><i class="delete-show ios-close">×</i></div>
              <div class="add-content"></div>
              <div style="padding:0.5em 0.5em; display: flex; justify-content: space-between" class="operation"></div>
               </div>`,
            );
            for (const m in vm.data.formMap[point].fieldMap){
              $('#' + point).find('.add-content').append(`<div style="color:black; border-top: 1px solid #cccccc;display: flex;padding: 0 0.8em; justify-content: space-between" id="${point + '-' + m}"><div class="param-name" style="font-size: 12px">${vm.data.formMap[point].fieldMap[m].name}</div><div><span class="edit-row" style="cursor: pointer; margin-right: 10px">✏</span><span class="delete-row" style="cursor: pointer">×</span></div></div>`);
              vm.instance.addEndpoint(point + '-' + m, {
                uuid: `${point + '-' + m}-left`,
                anchor: 'Left',
                maxConnections: -1,
                connectorStyle: { stroke: color },
              }, {
                isSource: true,
                isTarget: true,
                dragAllowedWhenFull: true,
              });
              vm.instance.addEndpoint(point + '-' + m, {
                uuid: `${point + '-' + m}-right`,
                anchor: 'Right',
                maxConnections: -1,
                connectorStyle: { stroke: color },
              }, {
                isSource: true,
                isTarget: true,
                dragAllowedWhenFull: true,
              });
            }
            $('#' + point).css('left', vm.data.formMap[point].x);
            $('#' + point).css('top', vm.data.formMap[point].y);
            vm.instance.draggable(`${point}`);
          }
          // 编辑表格名称
          $('.click-point').bind('click', function (e){
            vm.editVisible = true;
            vm.currentTable = e.target.parentNode.parentNode.id;
            let index = 0;
            for (const k in vm.data.formMap){
              if (k == e.target.parentNode.parentNode.id){
                vm.currentItem = index
                vm.tableForm = { ...vm.data.formMap[k] };
                break;
              }
              index++;
            }
          });
          // 删除Node
          $('.delete-show').bind('click', function (e){
            if (confirm('确定删除该数据表吗')){
              vm.instance.remove(e.target.parentNode.parentNode.id);
            }
          });
          // 编辑每一行字段
          $('.edit-row').bind('click', function (e){
            let tableCode = e.target.parentNode.parentNode.id.split('-')[0];
            let paramCode = e.target.parentNode.parentNode.id.split('-')[1];
            let index = 0
            for (const n in vm.data.formMap){
              if (n == tableCode){
                vm.currentItem = index;
                vm.tableForm = { ...n };
                let index1 = 0;
                for (const q in vm.data.formMap[n].fieldMap){
                  if (q == paramCode){
                    vm.currentParam = { ...vm.data.formMap[n].fieldMap[q] };
                    vm.lastParam = { ...vm.data.formMap[n].fieldMap[q] };
                    vm.currentParamIndex = index1;
                    break;
                  }
                  index1++;
                }
              }
              index++;
            }
            vm.dialogVisible = true;
          });
          // init transition
          for (const i in vm.data.formMap){
            // 有关系表
            for (const p in vm.data.formMap[i].fieldMap){
              let targetLines = vm.data.formMap[i].fieldMap[p].otherAttrs.targetLines;
              if (targetLines && targetLines.length > 0){
                for (const line in targetLines){
                  const uuid = [targetLines[line].formId + '-' + targetLines[line].fieldId + '-right', targetLines[line].targetFormId + '-' + targetLines[line].targetFieldId + '-left'];
                  vm.instance.connect({
                    uuids: uuid,
                    overlays,
                  });
                }
              }
            }
            // const uuid = [i.parentEntityCode + '-' + i.parentRelationColumnCode + '-right', i.childEntityCode + '-' + i.childRelationColumnCode + '-left'];
            // if (i.cardinalType === 0) {
            //   overlays = [
            //     ['Arrow', {location: 0.7}, arrowCommon],
            //     ['Label', {label: '1', id: 'label-1', location: 0.1}],
            //     ['Label', {label: '1', id: 'label-n', location: 0.9}],
            //   ];
            // } else if (i.cardinalType === 1) {
            //   overlays = [
            //     ['Arrow', {location: 0.7}, arrowCommon],
            //     ['Label', {label: '1', id: 'label-1', location: 0.1}],
            //     ['Label', {label: 'N', id: 'label-n', location: 0.9}],
            //   ];
            // } else if (i.cardinalType === 2) {
            //   overlays = [
            //     ['Arrow', {location: 0.7}, arrowCommon],
            //     ['Label', {label: 'N', id: 'label-1', location: 0.1}],
            //     ['Label', {label: '1', id: 'label-n', location: 0.9}],
            //   ];
            // }
            // vm.instance.connect({
            //   uuids: uuid,
            //   overlays,
            // });
          }
          vm.instance.bind('click', function (conn, originalEvent){
            if (confirm('确定删除所点击的链接吗？')){
              vm.instance.deleteConnection(conn);
              vm.data.formMap[conn.sourceId.split('-')[0]].fieldMap[conn.sourceId.split('-')[1]].otherAttrs.targetLines.forEach(element => {
                if (element.targetFormId == conn.targetId.split('-')[0] && element.targetFieldId == conn.targetId.split('-')[1]){
                  let i = vm.data.formMap[conn.sourceId.split('-')[0]].fieldMap[conn.sourceId.split('-')[1]].otherAttrs.targetLines.indexOf(element);
                  vm.data.formMap[conn.sourceId.split('-')[0]].fieldMap[conn.sourceId.split('-')[1]].otherAttrs.targetLines.splice(i, 1);
                }
              })
            }
          });
        });
        vm.instance.fire('jsPlumbDemoLoaded', vm.instance);
      },
      refresh(){
        let vm = this;
        const arrowCommon = { foldback: 0.7, width: 12 };
        // use three-arg spec to create two different arrows with the common values:
        let overlays = [
          ['Arrow', { location: 0.7 }, arrowCommon],
          ['Label', { label: '1', id: 'label-1', location: 0.1 }],
          ['Label', { label: 'N', id: 'label-n', location: 0.9 }],
        ];
        vm.instance.clearParent();
        vm.instance.deleteEveryConnection();
        vm.instance.deleteEveryEndpoint();
        vm.instance.batch(function (){
          for (const point of vm.data.schemes){
            for (const m of point.columns){
              vm.instance.addEndpoint(point.code + '-' + m.code, {
                uuid: `${point.code + '-' + m.code}-left`,
                anchor: 'Left',
                maxConnections: -1,
                connectorStyle: { stroke: '#61B7CF' },
              }, {
                isSource: true,
                isTarget: true,
                dragAllowedWhenFull: true,
              });
              vm.instance.addEndpoint(point.code + '-' + m.code, {
                uuid: `${point.code + '-' + m.code}-right`,
                anchor: 'Right',
                maxConnections: -1,
                connectorStyle: { stroke: '#61B7CF' },
              }, {
                isSource: true,
                isTarget: true,
                dragAllowedWhenFull: true,
              });
//              vm.instance.draggable(`${point.code + '-' + m.code}-left`);
//              vm.instance.draggable(`${point.code + '-' + m.code}-right`);
            }
          }
          // for (const i of vm.data.relations) {
          //   // 有关系表
          //   if (i.middleRelationEntityCode !== null) {
          //     const uuid = [i.parentEntityCode + '-' + 'Id' + '-right', i.middleRelationEntityCode + '-' + i.parentRelationColumnCode + '-left'];
          //     vm.instance.connect({
          //       uuids: uuid,
          //       overlays,
          //     });
          //     const uuid1 = [i.middleRelationEntityCode + '-' + i.childRelationColumnCode + '-right', i.childEntityCode + '-' + 'Id' + '-left'];
          //     vm.instance.connect({
          //       uuids: uuid1,
          //       overlays,
          //     });
          //     continue;
          //   }
          //   const uuid = [i.parentEntityCode + '-' + i.parentRelationColumnCode + '-right', i.childEntityCode + '-' + i.childRelationColumnCode + '-left'];
          //   if (i.cardinalType === 0) {
          //     overlays = [
          //       ['Arrow', {location: 0.7}, arrowCommon],
          //       ['Label', {label: '1', id: 'label-1', location: 0.1}],
          //       ['Label', {label: '1', id: 'label-n', location: 0.9}],
          //     ];
          //   } else if (i.cardinalType === 1) {
          //     overlays = [
          //       ['Arrow', {location: 0.7}, arrowCommon],
          //       ['Label', {label: '1', id: 'label-1', location: 0.1}],
          //       ['Label', {label: 'N', id: 'label-n', location: 0.9}],
          //     ];
          //   } else if (i.cardinalType === 2) {
          //     overlays = [
          //       ['Arrow', {location: 0.7}, arrowCommon],
          //       ['Label', {label: 'N', id: 'label-1', location: 0.1}],
          //       ['Label', {label: '1', id: 'label-n', location: 0.9}],
          //     ];
          //   }
          //   vm.instance.connect({
          //     uuids: uuid,
          //     overlays,
          //   });
          // }
        });
      }
    },
    mounted(){
      jsPlumb.ready(() => {
        this.createFlow(this.data);
      });
    },
  };
</script>

<style>

</style>
