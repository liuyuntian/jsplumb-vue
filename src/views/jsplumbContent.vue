<template>
    <div class="point-parent" id="points-parent" @mousedown="mouseDown" @mousemove="mouseMove" @mouseup="mouseUp">
        <div class="panel-body points demo flow_chart" id="points" :style="calZoom" style="top: 0;left: 0;"
             ref="canvas">
            <div v-for="(val, point) in data.map"  class="point" :style="calPosition(point, val)">
                <div class="content-name" :id="val.id" style="font-size: 12px;">{{val.name}}</div></div>
        </div>
    </div>
</template>
<script>
    exports = {
        templateType: 'vue',
        data: function () {
            return {
                zoom: 1,
                jsPlumbReady: false,
                instance: null,
            }
        },
        props: {
            data: {}
        },
        computed: {
            calZoom(e) {
                if (e > 0) {
                    this.zoom += 0.1
                } else if (e < 0) {
                    this.zoom -= 0.1
                }
                let z = {
                    "-webkit-transform": `scale(${this.zoom.toFixed(1)})`,
                    "-moz-transform": `scale(${this.zoom.toFixed(1)})`,
                    "-ms-transform": `scale(${this.zoom.toFixed(1)})`,
                    "-o-transform": `scale(${this.zoom.toFixed(1)})`,
                    "transform": `scale(${this.zoom.toFixed(1)})`
                };
                console.log(this.zoom);
                return z;
            }
        },
        methods: {
            mouseUp() {},
            mouseMove() {},
            mouseDown() {},
            createFlow() {
                let vm = this;
                const color = '#409EFF';
                window.s = vm.instance = jsPlumb.getInstance({
                    // notice the 'curviness' argument to this Bezier curve.
                    // the curves on this page are far smoother
                    // than the curves on the first demo, which use the default curviness value.
                    Connector: ["Flowchart"],
                    DragOptions: {cursor: 'pointer', zIndex: 5000},
                    PaintStyle: {lineWidth: 5, stroke: color},
                    HoverPaintStyle: {stroke: '#66b1ff', lineWidth: 20},
                    deleteEndpointsOnDetach: false,
                    Container: 'points',
                    Endpoint: ['Blank', {radius: 12}],
                    EndpointStyle: {
                        stroke: "#aaa",
                        fill: "#F2F2F2",
                        radius: 3,
                        strokeWidth: 1
                    },
                    ConnectionOverlays: [  //连线的叠加组件，如箭头、标签
                        ["Arrow", {  //箭头参数设置
                            location: 1,
                            visible: true,
                            width: 11,
                            length: 11,
                            id: "ARROW",
                        }]
                    ]
                });
                setTimeout(() => {
                    vm.instance.draggable(document.querySelectorAll('.point'), {
                        containment: 'points',
                        // 拖拽后改变位置
                        stop: function (e) {
                            vm.data.map[e.el.id].x = (e.pos[0] / e.el.parentNode.offsetWidth).toFixed(2) * 100;
                            vm.data.map[e.el.id].y = (e.pos[1] / e.el.parentNode.offsetHeight).toFixed(2) * 100;
                        }
                    });
                    vm.instance.draggable(document.querySelectorAll('.left-sub-title'), {
                        helper: 'clone',
                        scope: 'ss',
                        drag: function (e) {
                            if (e.el.className.indexOf('left-sub-title') > -1) {
                                vm.isDragging = true;
                                vm.showName = e.el.textContent;
                                vm.$refs.controlNode.id = e.el.id
                                vm.$refs.controlNode.style.left = e.pos[0] + 6 + 'px';
                                vm.$refs.controlNode.style.top = e.pos[1] + 54 + 'px';
                            }
                        },
                        stop: function () {
                            vm.isDragging = false;
                        }
                    });
                    // 拖拽新增
                    vm.instance.droppable('points', {
                        scope: 'ss',
                        drop: function (event) {
                            if (vm.isDragging) {
                                let leftP = ((event.e.x - vm.$refs.leftContent.offsetWidth) / event.drop.el.offsetWidth).toFixed(2) * 100;
                                let topP = (event.e.y / event.drop.el.offsetHeight).toFixed(2) * 100;
                                vm.ajax4getFields(vm.$router.query.moduleId, event.drag.el.id, function (response) {
                                    // 数组转换成map
                                    let map = {};
                                    response.fields.forEach(row => {
                                        map[row.id] = row
                                    })
                                    vm.$set(vm.data.formMap, event.drag.el.id, {
                                        x: leftP,
                                        y: topP,
                                        name: event.drag.el.textContent,
                                        fieldIds: [1, 2],//字段id列表
                                        fieldMap: map
                                    });
                                    vm.data.formId.push(event.drag.el.id)
                                    vm.isDragging = false;
                                    vm.showName = '';
                                    vm.$nextTick(() => {
                                        vm.addNew();
                                    });
                                })
                            }
                        }
                    });
                    vm.setjsPlumbAttr();
                }, 100)

            },
            setjsPlumbAttr() {
                let vm = this;
                // suspend drawing and initialise.
                vm.instance.batch(() => {
                    // init point
                    for (const point in vm.data.map) {
                        vm.instance.makeSource(vm.data.map[point].id, {
                            anchor: "Continuous",
                            endpoint: 'Dot',
                            allowLoopback: false
                        });
                        vm.instance.makeTarget(vm.data.map[point].id, {
                            anchor: "Continuous",
                            endpoint: 'Dot',
                            allowLoopback: false
                        });
                    }
                    // init transition
                    for (const i in vm.data.lineMap) {
                        // 有关系表
                        let me = vm.instance.connect({
                            source: vm.data.lineMap[i].fromId,
                            target: vm.data.lineMap[i].toId,
                            endpoint: 'Dot',
                            paintStyle: {
                                strokeWidth: 1,
                                stroke: vm.data.lineMap[i].lineType === 1 ? '#409EFF' : '#67C23A'
                            },
                            hoverPaintStyle: {
                                stroke: vm.data.lineMap[i].lineType === 1 ? '#66b1ff' : '#85ce61',
                                strokeWidth: 3
                            }
                        })
                        // me.getOverlay('label').setLabel(vm.data.lineMap[i].lineType === 1 ? '关联' : '推送');
                    }
                    vm.instance.bind('click', function (conn, originalEvent) {
                        vm.editTable(conn);
                    });
                    vm.instance.bind("connection", function (connInfo, originalEvent) {
                        connInfo.connection.getOverlay('label').setLabel(vm.lineAttr.lineType === 1 ? '关联' : '推送')
                        if (vm.lineAttr.lineType === 1) {
                            vm.lineAttr.cardinality = 'many2one'
                            connInfo.connection.getOverlay('labelF').setLabel('N')
                            connInfo.connection.getOverlay('labelE').setLabel('1')
                            vm.data.formMap[connInfo.connection.sourceId.split('-')[0]].fieldMap[connInfo.connection.sourceId.split('-')[1]].otherAttrs.useRelation = true;
                        }
                        vm.data.formMap[connInfo.connection.sourceId.split('-')[0]].fieldMap[connInfo.connection.sourceId.split('-')[1]].otherAttrs.targetLines.push(vm.lineAttr);
                        vm.data.lineIds.push(vm.lineAttr.lineId);
                        vm.ajax4saveFormFieldRelations(vm.$router.query.moduleId, connInfo.connection.sourceId.split('-')[0], connInfo.connection.sourceId.split('-')[1], vm.data.formMap[connInfo.connection.sourceId.split('-')[0]].fieldMap[connInfo.connection.sourceId.split('-')[1]].otherAttrs, function (response) {
                            vm.$message({
                                message: '连接成功',
                                type: 'success'
                            });
                        }, function (error) {
                            vm.$message({
                                message: error,
                                type: 'error'
                            });
                        });
                    });
                });
                vm.instance.fire('jsPlumbDemoLoaded', vm.instance);
            },
            // 没有坐标生成1000 X 500 的随机坐标
            calPosition(point, val) {
                let x,y,w,h = null
                if (val.x && val.y) {
                    x = val.x + '%'
                    y = val.y + '%'
                } else {
                    let randomX = Math.ceil(Math.random() * 70);
                    let randomY = Math.ceil(Math.random() * 70);
                    this.data.map[point].x = randomX;
                    this.data.map[point].y = randomY;
                    x = randomX + '%'
                    y = randomY + '%'
                }
                if(val.w && val.h) {
                    w = val.w + 'px'
                    h = val.h + 'px'
                } else {
                    w = '100px'
                    h =  '80px'
                }
                return {left: x, top: y, height: h, width: w}
            },
        },
        mounted: function () {
            jsPlumb.ready(() => {
                this.jsPlumbReady = true;
            });
        },
        watch: {
            jsPlumbReady(val) {
                if(val && this.data) {
                    this.createFlow()
                }
            }
        }
    }
</script>
<style>
    .point-parent{
        height: 100%;
        width: 100%;
    }
    .point{
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #000;
        border: 1px solid #808080;
        box-shadow: 2px 2px 2px #808080;
        background: white;
    }
    .point:hover {
        border: 1px solid #808080;
        box-shadow: 2px 2px 19px #444;
        -o-box-shadow: 2px 2px 19px #444;
        -webkit-box-shadow: 2px 2px 19px #444;
        -moz-box-shadow: 2px 2px 19px #fff;
        opacity: 0.9;
        color: #000;
        filter: alpha(opacity=90);
    }
    .content-name{
        height: 90%;
        width: 90%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>