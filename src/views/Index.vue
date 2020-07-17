<template>
    <div id="drawDiv" @mousemove="moveMouse($event)" style="height: 100%;">
        <div>
            <div style="padding: 10px 20px; text-align: center; background: #cccccc;color: #000;width: 100px; cursor: pointer"
                 @click="refresh">恢复默认
            </div>
            <el-button @click="createDiv">新建</el-button>
        </div>
        <div class="panel-body points demo flow_chart" id="points" style="height: 80%;">
          <div v-for="(val, point) in data.formMap" :id="point" class="point" :style="calPosition(val)">
            <div style="padding:0 0.5em; background: #409EFF; cursor: default; display: flex; justify-content: space-between"><span class="click-point">⚙</span><span class="name-change" style="font-size: 12px;">{{val.name}}</span><i class="delete-show ios-close">×</i></div>
            <div class="add-content">
              <div v-for="(val1, m) in val.fieldMap" style="color:black; border-top: 1px solid #cccccc;display: flex;padding: 0 0.8em; justify-content: space-between" :id="point + '-' + m"><div class="param-name" style="font-size: 12px">{{val1.name}}</div><div><span class="edit-row" style="cursor: pointer; margin-right: 10px">✏</span><span class="delete-row" style="cursor: pointer">×</span></div></div>
            </div>
            <div style="padding:0.5em 0.5em; display: flex; justify-content: space-between" class="operation"></div>
          </div>
        </div>
        <el-dialog
                title="关联设置"
                :visible.sync="editVisible"
                width="30%">
            <el-form v-if="tableForm" ref="tableForm" :model="tableForm" label-width="100" :rules="ruleInline">
                <el-form-item prop="name" label="子表名：">
                    <el-input v-model="data.formMap[tableForm.formId].name" readonly/>
                </el-form-item>
                <el-form-item prop="code" label="子表明关联字段">
                  <el-input v-model="data.formMap[tableForm.formId].fieldMap[tableForm.fieldId].name" readonly/>
                </el-form-item>
              <el-form-item prop="name" label="父表名：">
                <el-input v-model="data.formMap[tableForm.targetFormId].name" readonly/>
              </el-form-item>
              <el-form-item prop="code" label="父表关联字段">
                <el-input v-model="data.formMap[tableForm.targetFormId].fieldMap[tableForm.targetFieldId].name" readonly/>
              </el-form-item>
              <el-form-item prop="code" label="父表关联显示字段">
                <el-select style="width: 100%" v-model="tableForm.targetDisplayFieldId" @change="changeSelect">
                  <el-option v-for="(val, key) in data.formMap[tableForm.targetFormId].fieldMap" :key="key" :value="val.id" :label="val.name"></el-option>
                </el-select>
              </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="editCancel">取 消</el-button>
                <el-button type="error" @click="deleteConnection">删 除</el-button>
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
        tableForm: null,
        currentItem: 0,
        currentConn: null,
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
      calPosition(val) {
        if (val.x && val.y) {
          return {left: val.x + 'px', top: val.y + 'px'}
        } else {
          return {left: Math.ceil(Math.random()*1000) + 'px', top: Math.ceil(Math.random()*800) + 'px'}
        }
      },
      changeSelect(e) {
        console.log(this.tableForm.targetDisplayFieldId);
        console.log(this.data.formMap[this.tableForm.targetFormId].fieldMap);
      },
      editCancel(){
        this.editVisible = false;
        this.tableForm = null;
      },
      tableChange(){
        // 保存修改后连线
        this.editVisible = false;
        console.log(this.data);
      },
      cancel(){
        this.dialogVisible = false;
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
      // 增加字段项
      editTable(conn) {
        let vm = this;
        vm.editVisible = true;
        vm.currentConn = conn;
        vm.data.formMap[conn.sourceId.split('-')[0]].fieldMap[conn.sourceId.split('-')[1]].otherAttrs.targetLines.forEach(element => {
          if (element.targetFormId == conn.targetId.split('-')[0] && element.targetFieldId == conn.targetId.split('-')[1]){
            vm.currentItem = vm.data.formMap[conn.sourceId.split('-')[0]].fieldMap[conn.sourceId.split('-')[1]].otherAttrs.targetLines.indexOf(element);
            vm.tableForm = element
          }
        })
      },
      deleteConnection() {
        let vm = this;
        vm.instance.deleteConnection(vm.currentItem);
        vm.data.formMap[vm.currentItem.sourceId.split('-')[0]].fieldMap[vm.currentItem.sourceId.split('-')[1]].otherAttrs.targetLines.splice(vm.currentItem, 1);
      },
      createFlow(){
        let vm = this;
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
            ['Arrow', { location: 0.7 }, arrowCommon]
          ];
          // init point
          for (const point in vm.data.formMap){
            for (const m in vm.data.formMap[point].fieldMap){
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
            vm.instance.draggable(`${point}`);
          }
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
          }
          vm.instance.bind('click', function (conn, originalEvent){
            vm.editTable(conn);
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
            for (const m of point.columns){lu
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
            }
          }
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
