<template>
  <div id="drawDiv" @mousemove="moveMouse($event)" style="height: 100%;">
    <div>
      <div style="padding: 10px 20px; text-align: center; background: #cccccc;color: #000;width: 100px; cursor: pointer"
           @click="refresh">恢复默认
      </div>
      <Button @click="createDiv">新建</Button>
    </div>
    <div class="panel-body points demo flow_chart" id="points" style="height: 80%;">
    </div>
    <Modal
      title="修改表属性"
      v-model="dialogVisible">
      <Form v-mode="tableForm">
        <FormItem label="表名：">
          <Input disabled v-model="tableForm.name"></Input>
        </FormItem>
        <FormItem label="Code：">
          <Input disabled v-model="tableForm.code"></Input>
        </FormItem>
      </Form>
      <Form ref="form" :model="currentParam">
        <FormItem label="字段名：">
          <Input v-model="currentParam.name"></Input>
        </FormItem>
        <FormItem label="code：">
          <Input v-model="currentParam.code"></Input>
        </FormItem>
        <FormItem label="类型：">
          <Select v-model="currentParam.dataType" label-in-value="true" placeholder="请选择类型"
                  @on-change="getSelectedValue">
            <Option
              v-for="o in options"
              :key="o.value"
              :label="o.label"
              :value="o.value">
            </Option>
          </Select>
        </FormItem>
      </Form>
      <span slot="footer" class="dialog-footer">
    <Button @click="cancel">取 消</Button>
    <Button type="primary" @click="editOk">确 定</Button>
  </span>
    </Modal>
    <Modal
      title="修改表名"
      v-model="editVisible"
      width="30%">
      <Form ref="tableForm" :model="tableForm" :label-width="60" :rules="ruleInline">
        <FormItem prop="name" label="表名：">
          <Input v-model="tableForm.name"/>
        </FormItem>
        <FormItem prop="code" label="Code：">
          <Input :disabled="newNodeEvent == null" v-model="tableForm.code"/>
        </FormItem>
      </Form>
      <span slot="footer" class="dialog-footer">
    <Button @click="editCancel">取 消</Button>
    <Button type="primary" @click="tableChange">确 定</Button>
  </span>
    </Modal>
  </div>

</template>

<script>
  import $ from 'jquery';
  import myData from '../assets/data.json';

  require('iview/dist/styles/iview.css');
  require('../assets/css/demo.css');
  require('../assets/css/jsplumb.css');

  export default {
    components: {},
    name: 'Index',
    data() {
      return {
        ruleInline: {
          user: [
            {required: true, message: '请填写表名', trigger: 'blur'},
          ],
          password: [
            {required: true, message: '请填写Code', trigger: 'blur'},
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
    created() {
      this.data = myData;
    },
    methods: {
      getSelectedValue(g) {
        this.currentParam.dataType = g.value;
        this.currentParam.dataTypeText = g.label;
      },
      editOk() {
        this.data.schemes[this.currentItem].columns[this.currentParamIndex] = this.currentParam;
        $('#' + this.data.schemes[this.currentItem].code + '-' + this.data.schemes[this.currentItem].columns[this.currentParamIndex].code).find('.param-name').html(this.currentParam.name + '(' + this.currentParam.dataTypeText + ')');
        this.dialogVisible = false;
      },
      editCancel() {
        this.editVisible = false;
        this.tableForm = {};
      },
      tableChange() {
        this.editVisible = false;
        this.$refs.tableForm.validate((valid) => {
          if (valid) {
            this.$Message.success('修改成功!');
            this.data.schemes[this.currentItem].name = this.tableForm.name;
            this.data.schemes[this.currentItem].code = this.tableForm.code;
          } else {
            this.$Message.error('修改失败，请正确完善信息！');
          }
        });
        console.log(this.data.schemes);
      },
      cancel() {
        this.dialogVisible = false;
      },
      newConfirm() {
        const vm = this;
        for (const i of this.data.schemes) {
          if (vm.tableForm.code === i.code) {
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
        $('.click-point').bind('click', function (e) {
          vm.dialogVisible = true;
          vm.currentTable = e.target.parentNode.parentNode.id;
          console.log(vm.currentTable);
        })
        $('.delete-show').bind('click', function () {

        });
        vm.currentTable = vm.tableForm.code;
        $('#' + vm.currentTable).find('.name-change').html(vm.tableForm.name)
        $('#' + vm.currentTable).find('.add-content').empty();
        vm.instance.removeAllEndpoints($('#' + vm.currentTable).attr('id'));
        // 编辑的数据和点
        for (const i of vm.tableForm.columns) {
          $('#' + vm.currentTable).find('.add-content').append(`<div id="${vm.currentTable + ' ' + i.code}" class="param-name" style="padding: 0 0.8em;border-top: 1px solid #cccccc; font-size: 12px">${i.name}</div>`);
          vm.instance.addEndpoint(vm.currentTable + ' ' + i.code, {
            uuid: `${vm.currentTable + ' ' + i.code}-left`,
            anchor: 'Left',
            maxConnections: -1,
            connectorStyle: {stroke: 'green'},
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
      createDiv() {
        this.newNodeEvent = true;
        this.dialogVisible = true;
      },
      moveMouse(event) {
        if (this.isDragging === true) {
          this.newElements.style.left = event.offsetX;
          this.newElements.style.top = event.offsetY;
          console.log(event.offsetX + ',' + event.offsetY);
        }
      },
      addParam() {
        const vm = this;
        if (this.newNodeEvent === null) {
          vm.dialogVisible = false;
          $('#' + vm.currentTable).find('.name-change').html(vm.tableForm.name)
          $('#' + vm.currentTable).find('.add-content').empty();
          vm.instance.removeAllEndpoints($('#' + vm.currentTable).attr('id'));
          // 编辑的数据和点
          for (const i of vm.tableForm.columns) {
            $('#' + vm.tableForm.code).find('.add-content').append(`<div style="border-top: 1px solid #cccccc;display: flex;padding: 0 0.8em; justify-content: space-between" id="${vm.tableForm.code + '-' + i.code}"><div class="param-name" style="font-size: 12px">${i.name}(${i.dataTypeText})</div><div><span style="cursor: pointer; margin-right: 10px">🖊</span><span style="cursor: pointer">×</span></div></div>`);
            vm.instance.addEndpoint(vm.currentTable + ' ' + i.code, {
              uuid: `${vm.currentTable + '-' + i.code}-left`,
              anchor: 'Left',
              maxConnections: -1,
              connectorStyle: {stroke: '#61B7CF'},
            }, {
              isSource: true,
              isTarget: true,
              dragAllowedWhenFull: true,
            });
            vm.instance.addEndpoint(vm.currentTable + '-' + i.code, {
              uuid: `${vm.currentTable + '-' + i.code}-right`,
              anchor: 'Right',
              maxConnections: -1,
              connectorStyle: {stroke: '#61B7CF'},
            }, {
              isSource: true,
              isTarget: true,
              dragAllowedWhenFull: true,
            });
          }
          for (const i of vm.data.line) {
            if (i[0] === vm.currentTable) {
              const uuid = [`${i[0]}-bottom`, `${i[1]}-top`];
              vm.instance.connect({
                uuids: uuid,
                overlays,
              });
            } else if (i[1] === vm.currentTable) {
              const uuid = [`${i[0]}-bottom`, `${i[1]}-top`];
              vm.instance.connect({
                uuids: uuid,
                overlays,
              });
            }
          }
        } else {
          vm.newConfirm();
        }
      },
      // 增加字段项
      addColumns() {
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
      deleteColumns(index) {
        this.tableForm.columns.splice(index, 1);
      },
      createFlow(flowData) {
        var vm = this;
        console.log('Index created');
        const color = '#aaccdd';
       window.s = vm.instance = jsPlumb.getInstance({
          // notice the 'curviness' argument to this Bezier curve.
          // the curves on this page are far smoother
          // than the curves on the first demo, which use the default curviness value.
          Connector: ['Flowchart', {curviness: 50}],
          Endpoint: ['Dot', {radius: 11}],
          DragOptions: {cursor: 'pointer', zIndex: 5000},
          PaintStyle: {lineWidth: 5, stroke: '#808080'},
          EndpointStyle: {radius: 9, fill: color, stroke: '#aaccdd'},
          HoverPaintStyle: {stroke: '#445566', lineWidth: 4},
          EndpointHoverStyle: {fill: '#acd', stroke: '#acd'},
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
          const arrowCommon = {foldback: 0.7, width: 12};
          // use three-arg spec to create two different arrows with the common values:
          let overlays = [
            ['Arrow', {location: 0.7}, arrowCommon],
            ['Label', {label: '1', id: 'label-1', location: 0.1}],
            ['Label', {label: 'N', id: 'label-n', location: 0.9}],
          ];
          vm.overlay = overlays;
          // init point
          for (const point of vm.data.schemes) {
            $('.points').append(
              `<div id="${point.code}" class="point">
              <div style="padding:0.5em 0.5em; background: #acd; cursor: default; display: flex; justify-content: space-between"><i class="click-point">❗</i><span class="name-change" style="font-size: 12px;">${point.name}</span><i class="delete-show ios-close">×</i></div>
              <div class="add-content"></div>
              <!--<div style="display: flex; justify-content: start" class="operation"><span>添加字段</span><span>查看数据</span></div>-->
               </div>`,
            );
            for (const m of point.columns) {
              $('#' + point.code).find('.add-content').append(`<div style="border-top: 1px solid #cccccc;display: flex;padding: 0 0.8em; justify-content: space-between" id="${point.code + '-' + m.code}"><div class="param-name" style="font-size: 12px">${m.name}(${m.dataTypeText})</div><div><span class="edit-row" style="cursor: pointer; margin-right: 10px">✏</span><span class="delete-row" style="cursor: pointer">×</span></div></div>`);
              vm.instance.addEndpoint(point.code + '-' + m.code, {
                uuid: `${point.code + '-' + m.code}-left`,
                anchor: 'Left',
                maxConnections: -1,
                connectorStyle: {stroke: '#61B7CF'},
              }, {
                isSource: true,
                isTarget: true,
                dragAllowedWhenFull: true,
              });
             vm.instance.addEndpoint(point.code + '-' + m.code, {
               uuid: `${point.code + '-' + m.code}-right`,
               anchor: 'Right',
               maxConnections: -1,
               connectorStyle: {stroke: '#61B7CF'},
             }, {
               isSource: true,
               isTarget: true,
               dragAllowedWhenFull: true,
             });
            }
          }
          // 编辑表格名称
          $('.click-point').bind('click', function (e) {
            vm.editVisible = true;
            vm.currentTable = e.target.parentNode.parentNode.id;
            for (let k = 0; k < vm.data.schemes.length; k++) {
              if (vm.data.schemes[k].code == e.target.parentNode.parentNode.id) {
                vm.currentItem = k;
                vm.tableForm = {...vm.data.schemes[vm.currentItem]};
                break;
              }
            }
            console.log(vm.data.schemes);
          })
          // 删除Node
          $('.delete-show').bind('click', function (e) {
            if (confirm('确定删除该数据表吗')) {
              vm.instance.remove(e.target.parentNode.parentNode.id);
            }
          });
          // 编辑每一行字段
          $('.edit-row').bind('click', function (e) {
            let tableCode = e.target.parentNode.parentNode.id.split('-')[0];
            let paramCode = e.target.parentNode.parentNode.id.split('-')[1];
            for (let n = 0; n < vm.data.schemes.length; n++) {
              if (vm.data.schemes[n].code == tableCode) {
                vm.currentItem = n;
                vm.tableForm = {...vm.data.schemes[n]};
                for (let q = 0; q < vm.data.schemes[n].columns.length; q++) {
                  if (vm.data.schemes[n].columns[q].code == paramCode) {
                    vm.currentParam = {...vm.data.schemes[n].columns[q]};
                    vm.lastParam = {...vm.data.schemes[n].columns[q]};
                    vm.currentParamIndex = q;
                    break;
                  }
                }
              }
            }
            vm.dialogVisible = true;
          });
          // init transition
         for (const i of vm.data.relations) {
           // 有关系表
           if (i.middleRelationEntityCode !== null) {
             const uuid = [i.parentEntityCode + '-' + 'Id' + '-right', i.middleRelationEntityCode + '-' + i.parentRelationColumnCode + '-left'];
             vm.instance.connect({
               uuids: uuid,
               overlays,
             });
             const uuid1 = [i.middleRelationEntityCode + '-' + i.childRelationColumnCode + '-right', i.childEntityCode + '-' + 'Id' + '-left'];
             vm.instance.connect({
               uuids: uuid1,
               overlays,
             });
             continue;
           }
           const uuid = [i.parentEntityCode + '-' + i.parentRelationColumnCode + '-right', i.childEntityCode + '-' + i.childRelationColumnCode + '-left'];
           if (i.cardinalType === 0) {
             overlays = [
               ['Arrow', {location: 0.7}, arrowCommon],
               ['Label', {label: '1', id: 'label-1', location: 0.1}],
               ['Label', {label: '1', id: 'label-n', location: 0.9}],
             ];
           } else if (i.cardinalType === 1) {
             overlays = [
               ['Arrow', {location: 0.7}, arrowCommon],
               ['Label', {label: '1', id: 'label-1', location: 0.1}],
               ['Label', {label: 'N', id: 'label-n', location: 0.9}],
             ];
           } else if (i.cardinalType === 2) {
             overlays = [
               ['Arrow', {location: 0.7}, arrowCommon],
               ['Label', {label: 'N', id: 'label-1', location: 0.1}],
               ['Label', {label: '1', id: 'label-n', location: 0.9}],
             ];
           }
           vm.instance.connect({
             uuids: uuid,
             overlays,
           });
         }
          // init location
          for (const i of flowData.schemes) {
            $('#' + i.code).css('left', i.location[0]);
            $('#' + i.code).css('top', i.location[1]);
          }

          for (const point of flowData.schemes) {
            vm.instance.draggable(`${point.code}`);
          }
          vm.instance.bind('click', function (conn, originalEvent) {
            if (confirm('确定删除所点击的链接吗？')) {
             vm.instance.deleteConnection(conn);
             vm.refresh()
            }
          });
        });
       vm.instance.fire('jsPlumbDemoLoaded', vm.instance);
      },
      refresh() {
        let vm = this;
        const arrowCommon = {foldback: 0.7, width: 12};
        // use three-arg spec to create two different arrows with the common values:
        let overlays = [
          ['Arrow', {location: 0.7}, arrowCommon],
          ['Label', {label: '1', id: 'label-1', location: 0.1}],
          ['Label', {label: 'N', id: 'label-n', location: 0.9}],
        ];
       vm.instance.clearParent();
        vm.instance.deleteEveryConnection();
        vm.instance.deleteEveryEndpoint();
        vm.instance.batch(function () {
          for (const point of vm.data.schemes) {
            for (const m of point.columns) {
              vm.instance.addEndpoint(point.code + '-' + m.code, {
                uuid: `${point.code + '-' + m.code}-left`,
                anchor: 'Left',
                maxConnections: -1,
                connectorStyle: {stroke: '#61B7CF'},
              }, {
                isSource: true,
                isTarget: true,
                dragAllowedWhenFull: true,
              });
              vm.instance.addEndpoint(point.code + '-' + m.code, {
                uuid: `${point.code + '-' + m.code}-right`,
                anchor: 'Right',
                maxConnections: -1,
                connectorStyle: {stroke: '#61B7CF'},
              }, {
                isSource: true,
                isTarget: true,
                dragAllowedWhenFull: true,
              });
//              vm.instance.draggable(`${point.code + '-' + m.code}-left`);
//              vm.instance.draggable(`${point.code + '-' + m.code}-right`);
            }
          }
          for (const i of vm.data.relations) {
            // 有关系表
            if (i.middleRelationEntityCode !== null) {
              const uuid = [i.parentEntityCode + '-' + 'Id' + '-right', i.middleRelationEntityCode + '-' + i.parentRelationColumnCode + '-left'];
              vm.instance.connect({
                uuids: uuid,
                overlays,
              });
              const uuid1 = [i.middleRelationEntityCode + '-' + i.childRelationColumnCode + '-right', i.childEntityCode + '-' + 'Id' + '-left'];
              vm.instance.connect({
                uuids: uuid1,
                overlays,
              });
              continue;
            }
            const uuid = [i.parentEntityCode + '-' + i.parentRelationColumnCode + '-right', i.childEntityCode + '-' + i.childRelationColumnCode + '-left'];
            if (i.cardinalType === 0) {
              overlays = [
                ['Arrow', {location: 0.7}, arrowCommon],
                ['Label', {label: '1', id: 'label-1', location: 0.1}],
                ['Label', {label: '1', id: 'label-n', location: 0.9}],
              ];
            } else if (i.cardinalType === 1) {
              overlays = [
                ['Arrow', {location: 0.7}, arrowCommon],
                ['Label', {label: '1', id: 'label-1', location: 0.1}],
                ['Label', {label: 'N', id: 'label-n', location: 0.9}],
              ];
            } else if (i.cardinalType === 2) {
              overlays = [
                ['Arrow', {location: 0.7}, arrowCommon],
                ['Label', {label: 'N', id: 'label-1', location: 0.1}],
                ['Label', {label: '1', id: 'label-n', location: 0.9}],
              ];
            }
            vm.instance.connect({
              uuids: uuid,
              overlays,
            });
          }
        })
        // init location
//        for (const i of flowData.schemes) {
//          $('#' + i.code).css('left', i.location[0]);
//          $('#' + i.code).css('top', i.location[1]);
//        }

        for (const point of vm.data.schemes) {
            // _katavorioDrag
          document.getElementById(point.code)._katavorioDrag = null
          vm.instance.draggable(`${point.code}`);
        }
//        vm.instance.bind('click', function (conn, originalEvent) {
//          if (confirm('确定删除所点击的链接吗？')) {
//            vm.instance.deleteConnection(conn);
////              vm.refresh()
//          }
//        });
      }
    },
    mounted() {
      jsPlumb.ready(() => {
        this.createFlow(this.data);
      });
    },
  };
</script>

<style>
  .point.chart_act_0 {
    color: #9cc;
  }

  .point.chart_act_1 {
    color: #fac;
  }
</style>
