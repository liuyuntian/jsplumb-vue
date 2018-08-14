<template>
  <div id="drawDiv" @mousemove="moveMouse($event)" style="height: 100%;">
    <div>
      <div style="padding: 10px 20px; text-align: center; background: #cccccc;color: #000;width: 100px; cursor: pointer"
           @click="createDiv">新建表
      </div>
    </div>
    <div class="panel-body points demo flow_chart" id="points" style="height: 80%;">
    </div>
    <Modal
      title="修改表属性"
      v-model="dialogVisible">
      <Form ref="form" :model="tableForm" :label-width="80">
        <FormItem label="表名：">
          <Input v-model="tableForm.name"></Input>
        </FormItem>
        <FormItem label="Code：">
          <Input :disabled="newNodeEvent == null" v-model="tableForm.code"></Input>
        </FormItem>
        <div style="height: 50px">
          <Button @click="addColumns" type="primary" style="float: right;font-size: 14px;">增加字段</Button>
        </div>
        <div v-for="(item,index) in tableForm.columns">
          <FormItem label="字段名：">
            <Input v-model="item.name"></Input>
          </FormItem>
          <FormItem label="code：">
            <Input v-model="item.code"></Input>
          </FormItem>
          <FormItem label="类型">
            <Select v-model="item.dataType" placeholder="请选择类型">
              <Option
                v-for="o in options"
                :key="o.value"
                :label="o.label"
                :value="o.value">
              </Option>
            </Select>
          </FormItem>
          <div style="height: 50px">
            <Button @click="deleteColumns(index)" type="primary" style="float: right;font-size: 14px;">删除</i></Button>
          </div>
        </div>
      </Form>
      <span slot="footer" class="dialog-footer">
    <Button @click="cancel">取 消</Button>
    <Button type="primary" @click="addParam">确 定</Button>
  </span>
    </Modal>
    <Modal
      title="删除表"
      v-model="deleteVisible"
      width="30%">
      <span>确定要删除该项吗？</span>
      <span slot="footer" class="dialog-footer">
    <Button @click="deleteVisible = false">取 消</Button>
    <Button type="primary" @click="deleteVisible = false">确 定</Button>
  </span>
    </Modal>
  </div>

</template>

<script>
  import 'iview/dist/styles/iview.css';
  import $ from 'jquery';
  import myData from '../assets/data.json';

  require('../assets/css/demo.css');
  require('../assets/css/jsplumb.css');

  export default {
    components: {},
    name: 'Index',
    data() {
      return {
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
        },
        currentItem: 0,
        currentInput: null,
        deleteVisible: false,
        dialogVisible: false,
        data: {
          schemes: [
            {
              id: '8747b9d8-640e-4dcd-9bd2-f0caa26881c2',
              code: '58c21d713819d56d68763918',
              name: 'MoeLove',
              status: '0',
              location: [80, 80],
            },
            {
              id: '8747b9d8-640e-4dcd-9bd2-f0caa26881c3',
              code: '58c21d803819d56d68763919',
              name: 'Moe',
              status: '1',
              location: [80, 200],
            },
            {
              id: '8747b9d8-640e-4dcd-9bd2-f0caa26881c4',
              code: '58c21da83819d56d6876391a',
              name: 'Love',
              status: '0',
              location: [80, 440],
            },
            {
              id: '8747b9d8-640e-4dcd-9bd2-f0caa26881c6',
              code: '58c63ecf3819d5a22f2c7f24',
              name: 'TaoBeier',
              status: '1',
              location: [400, 400],
            },
          ],
          line: [
            ['58c21d713819d56d68763918', '58c21d803819d56d68763919'],
            ['58c21d803819d56d68763919', '58c21da83819d56d6876391a'],
            ['58c21d803819d56d68763919', '58c63ecf3819d5a22f2c7f24'],
            ['58c21da83819d56d6876391a', '58c63ecf3819d5a22f2c7f24'],
          ],
        },
      };
    },
    created() {
      this.data = myData;
    },
    methods: {
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
          // for (const i of vm.data.line) {
          //   if (i[0] === vm.currentTable) {
          //     const uuid = [`${i[0]}-bottom`, `${i[1]}-top`];
          //     vm.instance.connect({
          //       uuids: uuid,
          //       overlays,
          //     });
          //   } else if (i[1] === vm.currentTable) {
          //     const uuid = [`${i[0]}-bottom`, `${i[1]}-top`];
          //     vm.instance.connect({
          //       uuids: uuid,
          //       overlays,
          //     });
          //   }
          // }
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
        const color = '#aaccdd00';
        vm.instance = jsPlumb.getInstance({
          // notice the 'curviness' argument to this Bezier curve.
          // the curves on this page are far smoother
          // than the curves on the first demo, which use the default curviness value.
          Connector: ['Flowchart', {curviness: 50}],
          Endpoint: ['Dot', {radius: 11}],
          DragOptions: {cursor: 'pointer', zIndex: 5000},
          PaintStyle: {lineWidth: 5, stroke: '#808080'},
          EndpointStyle: {radius: 9, fill: color, stroke: '#aaccdd00'},
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
              <div style="padding:0.5em 0.5em; background: #acd; cursor: default; display: flex; justify-content: space-between"><p class="click-point">🖊</p><span class="name-change" style="font-size: 12px;">${point.name}</span><p class="delete-show">×</p></div>
              <div class="add-content"></div>
              <!--<div style="display: flex; justify-content: start" class="operation"><span>添加字段</span><span>查看数据</span></div>-->
               </div>`,
            );
            for (const m of point.columns) {
              $('#' + point.code).find('.add-content').append(`<div style="border-top: 1px solid #cccccc;display: flex;padding: 0 0.8em; justify-content: space-between" id="${point.code + '-' + m.code}"><div class="param-name" style="font-size: 12px">${m.name}(${m.dataTypeText})</div><div><span style="cursor: pointer; margin-right: 10px">🖊</span><span style="cursor: pointer">×</span></div></div>`);
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
          $('.click-point').bind('click', function (e) {
            vm.dialogVisible = true;
            vm.currentTable = e.target.parentNode.parentNode.id;
            for (var k = 0; k < vm.data.schemes.length; k++) {
              if (vm.data.schemes[k].code == e.target.parentNode.parentNode.id) {
                vm.currentItem = k;
                vm.tableForm = vm.data.schemes[vm.currentItem];
                break;
              }
            }
          })
          // 删除Node
          $('.delete-show').bind('click', function (e) {
            if (confirm('确定删除该数据表吗')) {
              vm.instance.remove(e.target.parentNode.parentNode.id);
            }
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
            }
          });
        });
        vm.instance.fire('jsPlumbDemoLoaded', vm.instance);
      },
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
