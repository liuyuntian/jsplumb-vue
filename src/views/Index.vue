<template>
  <div id="drawDiv" @mousemove="moveMouse($event)">
    <div>
      <div style="padding: 10px 20px; text-align: center; background: #cccccc;color: #000;width: 100px; cursor: pointer"
           @click="createDiv()">表格
      </div>
    </div>
    <div class="panel-body points demo flow_chart" id="points">
    </div>
    <el-dialog
      title="修改表属性"
      :visible.sync="dialogVisible"
      width="30%">
      <el-form ref="form" :model="tableForm" label-width="80px">
        <el-form-item label="表名：">
          <el-input v-model="tableForm.name"></el-input>
        </el-form-item>
        <el-form-item label="Code：">
          <el-input :disabled="newNodeEvent == null" v-model="tableForm.code"></el-input>
        </el-form-item>
        <div style="height: 50px">
          <el-button @click="addColumns" type="primary" style="float: right;font-size: 14px;"><i
            class="el-icon-plus">增加字段</i></el-button>
        </div>
        <div v-for="(item,index) in tableForm.columns">
          <el-form-item label="字段名：">
            <el-input v-model="item.name"></el-input>
          </el-form-item>
          <el-form-item label="code：">
            <el-input v-model="item.code"></el-input>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="item.dataType" placeholder="请选择类型">
              <el-option label="int" value="1"></el-option>
              <el-option label="Array" value="2"></el-option>
            </el-select>
          </el-form-item>
          <div style="height: 50px">
            <el-button @click="deleteColumns(index)" type="primary" style="float: right;font-size: 14px;"><i
              class="el-icon-plus">删除</i></el-button>
          </div>
        </div>
      </el-form>
      <span slot="footer" class="dialog-footer">
    <el-button @click="cancel">取 消</el-button>
    <el-button type="primary" @click="addParam">确 定</el-button>
  </span>
    </el-dialog>
    <el-dialog
      title="删除表"
      :visible.sync="deleteVisible"
      width="30%">
      <span>确定要删除该项吗？</span>
      <span slot="footer" class="dialog-footer">
    <el-button @click="deleteVisible = false">取 消</el-button>
    <el-button type="primary" @click="deleteVisible = false">确 定</el-button>
  </span>
    </el-dialog>
  </div>

</template>

<script>
  import $ from 'jquery';
  import ElIcon from '../../node_modules/element-ui/packages/icon/src/icon';
  import MyMenu from '../views/Other';

  require('../assets/css/demo.css');
  require('../assets/css/jsplumb.css');

  export default {
    components: {ElIcon, MyMenu},
    name: 'Index',
    data() {
      return {
        newElements: null,
        newNodeEvent: null,
        isDragging: false,
        instance: {},
        currentTable: null,
        tableForm: {
          columns: [],
        },
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
              <div style="padding:0.5em 0.5em; display: flex; justify-content: space-between"><i class="click-point el-icon-edit"></i><span class="name-change" style="font-size: 14px;height: 20px;line-height: 20px">${vm.tableForm.name}</span><i class="delete-show el-icon-delete"></i></div>
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
          vm.deleteVisible = true;
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
        const color = '#acd';
        vm.instance = jsPlumb.getInstance({
          // notice the 'curviness' argument to this Bezier curve.
          // the curves on this page are far smoother
          // than the curves on the first demo, which use the default curviness value.
          Connector: ['Flowchart', {curviness: 50}],
          Endpoint: ['Dot', {radius: 11}],
          DragOptions: {cursor: 'pointer', zIndex: 5000},
          PaintStyle: {lineWidth: 5, stroke: '#808080'},
          EndpointStyle: {radius: 9, fill: color, stroke: 'red'},
          HoverPaintStyle: {stroke: '#445566', lineWidth: 4},
          EndpointHoverStyle: {fill: '#445566', stroke: '#acd'},
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
          const overlays = [
            ['Arrow', {location: 0.7}, arrowCommon],
            ['Label', {label: 'custom label', id: 'label'}],
          ];
          // init point
          for (const point of vm.data.schemes) {
            $('.points').append(
              `<div id="${point.code}" class="point">
              <div style="padding:0.5em 0.5em; display: flex; justify-content: space-between"><i class="click-point el-icon-edit"></i><span class="name-change" style="font-size: 14px;height: 20px;line-height: 20px">${point.name}</span><i class="delete-show el-icon-delete"></i></div>
              <div class="add-content"></div>
               </div>`,
            );
          }
          $('.click-point').bind('click', function (e) {
            vm.dialogVisible = true;
            vm.currentTable = e.target.parentNode.parentNode.id;
            for (const p of vm.data.schemes) {
              if (p.code == e.target.parentNode.parentNode.id) {
                vm.tableForm = p;
                break;
              }
            }
          })
          $('.delete-show').bind('click', function () {
            vm.deleteVisible = true;
          });
          // init transition
          for (const i of flowData.line) {
            const uuid = [`${i[0]}-bottom`, `${i[1]}-top`];
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
      const vm = this;
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
