<template lang="pug">
    xDialog.edit-image-dialog(:hide-on-blur="true", :scroll="false", v-model="editImageDialog")
        canvas(ref="hiddenCanvas" v-show="false")
        .input-text-editor(v-show="showTextEditor")
            .text-container
                .btns.font-size-32
                    span(@click="showTextEditor = false") 取消
                    span.complete(@click="addText()") 完成
                textarea.font-size-50(v-model="currentText" placeholder="请输入文字")
        .edit-image-container(data-base-parent="true")
            .edit-header
                span.btn(@click="editImageDialog = false") 取消
                span 编辑图片
                span.btn(@click="saveImage") 确认
            .canvas-container
                canvas(ref="imageCanvas")
                canvas(ref="drawCanvasLine",:class='{zIndex: setting.type==="line"}',
                @touchstart="start" @touchmove="move" @touchend="end"
                    @mousedown="down" @mousemove="mouseMove" @mouseup="mouseUp")
                canvas(ref="drawCanvasRect",:class='{zIndex: setting.type==="rect"}',
                @touchstart="start" @touchmove="move" @touchend="end"
                    @mousedown="down" @mousemove="mouseMove" @mouseup="mouseUp")
                .input-text.font-size-50(v-show="showText")
                    .mask(@click="focus = false")
                    span(@click="clickHandle()",
                    @mousedown="moveMousedownHandler",
                    @mousemove="moveMousemoveHandler",
                    @mouseup="moveMouseupHandler",
                    @mouseout="moveMouseupHandler",
                    @touchmove="moveTouchMove",
                    ref = "textMsg",
                    :class="{active:focus}",:style="textStylePx") {{currentText}}
            .color-chose
                div(v-for="color in colors", @click="selectColor(color)")
                    span.color-item(:style="{background:color}",
                    :class="{active: color === setting.color}")
                div.rect(@click="selectOption('rect')")
                    span(:class="{active: 'rect' === setting.type}")
                div.line(@click="selectOption('line')")
                    span(:class="{active: 'line' === setting.type}")
                div(@click="showEditor()")
                    i.iconfont.icon-t.font-size-36(:class="{active: 'text' === setting.type}")
                div(@click="init()")
                    i.iconfont.icon-delete.font-size-36
</template>

<script>
    import xDialog from 'vux/src/components/x-dialog'
    import DrawCanvas from './drawCanvas'
    function getDpr() {
        let dpr = document.querySelector('html').getAttribute('data-dpr')
        return parseInt(dpr)
    }
    export default {
        props     : ['value', 'img'],
        components: {xDialog},
        computed  : {
            editImageDialog: {
                get() {
                    return this.value
                },
                set(val) {
                    this.$emit('input', val)
                }
            },
            textMsg() {
                return this.$refs.textMsg
            },
            textH() {
                return this.$refs.textMsg.clientHeight / 2
            },
            textY() {
                return this.textMsg.offsetTop * (1 + this.scale) + this.textH
            },
            textX() {
                return this.textMsg.offsetLeft * (1 + this.scale)
            },
            lineWidth() {
                return 3 / this.scale
            },
            textStylePx() {
                let pxStyle = {}
                const textStyle = this.textStyle
                Object.keys(textStyle).forEach(k => {
                    pxStyle[k] = textStyle[k] + 'px'
                })
                pxStyle.fontSize = textStyle.fontSize * getDpr() + 'px'
                pxStyle.color = this.setting.color
                return pxStyle
            },
            isPC() {
                let isAndroid = window.navigator.appVersion.match(/android/gi)
                let isIPhone = window.navigator.appVersion.match(/iphone/gi)
                return !isAndroid && !isIPhone
            }
        },
        data() {
            const colors = ['#ff2b2b', '#f7ff5e', '#5489ff']
            return {
                drawLineCtx: {},
                drawRectCtx: {},
                currCtx    : {},
                imgCanvas  : {},
                colors,
                offsetTop  : 0,
                offsetLeft : 0,
                scale      : 0,
                ctx        : {},
                setting    : {
                    baseLineWidth: 5,
                    color        : colors[0],
                    type         : 'line',
                },
                textStyle: {
                    top       : 0,
                    left      : 0,
                    fontSize  : 60,
                    lineHeight: 100,
                },
                currentText    : '',
                mouseIsDown    : false,
                showText       : false,
                showTextEditor : false,
                moveMouseIsDown: false,
                focus          : true,
                textOffset     : {clientX: 0, clientY: 120},
                isClick        : false
            }
        },
        watch: {
            editImageDialog(val) {
                if (val) {
                    this.$nextTick(() => {
                        this.init()
                    })
                }
            },
        },
        methods: {
            saveImage() {
                this.drawTextToCanvas()
                let imgData = this.imgCanvas.toDataURL('image/png')
                let lineData = this.drawLineCtx.canvas.toDataURL('image/png')
                let rectData = this.drawRectCtx.canvas.toDataURL('image/png')
                let height = this.imgCanvas.height / 2
                let width = this.imgCanvas.width / 2
                let canvas = this.$refs.hiddenCanvas
                let ctx = canvas.getContext('2d')
                canvas.width = width
                canvas.height = height
                let imgs = [imgData, lineData, rectData]
                imgs.forEach((imgSrc, index) => {
                    let img = new Image()
                    img.src = imgSrc
                    img.onload = async () => {
                        ctx.drawImage(img, 0, 0, width, height)
                        let base = canvas.toDataURL('image/png')
                        if (index === imgs.length - 1) {
                            this.$emit('success', base)
                        }
                    }
                })
            },
            getPoint(e) {
                let touch = e.touches[0] || e.changedTouches[0]
                return this.getPointByClientPoint(touch)
            },
            getPointByClientPoint({clientX, clientY}) {
                this.countOffset()
                let x = (clientX - this.offsetLeft) / this.scale
                let y = (clientY - this.offsetTop) / this.scale
                return { x, y }
            },
            countOffset(dom = this.imgCanvas) {
                this.offsetTop = dom.offsetParent.offsetTop
                this.offsetLeft = dom.offsetParent.offsetLeft
            },
            selectColor(color) {
                this.setting.color = color
                this.drawRectCtx.setting.color = color
                this.drawLineCtx.setting.color = color
            },
            selectOption(type) {
                let Obj = {
                    rect: 'drawRectCtx',
                    line: 'drawLineCtx'
                }
                this.setting.type = type
                this.currCtx = this[Obj[type]]
            },
            clickHandle() {
                if (this.isPC) {
                    if (this.focus && this.isClick) {
                        this.showEditor()
                    }
                    this.isClick = true
                    this.focus = true
                    // pc端处理双击
                    setTimeout(() => {
                        this.isClick = false
                    }, 300)
                } else {
                    if (this.focus) {
                        this.showEditor()
                    }
                    this.focus = true
                }
            },
            showEditor() {
                this.showText = false
                this.showTextEditor = true
                this.setting.type = 'text'
            },
            addText() {
                this.showText = true
                this.showTextEditor = false
            },
            canvasTextAutoLine(str, ctx, x, y, lineHeight) {
                let lineWidth = 0
                let canvasWidth = this.imgCanvas.width
                let lastSubStrIndex = 0
                let initX = x
                let initY = y
                for (let i = 0; i < str.length; i++) {
                    lineWidth += ctx.measureText(str[i]).width
                    // 减去initX,防止边界出现的问题
                    if ((lineWidth + initX) * getDpr() > canvasWidth / this.scale * getDpr()) {
                        ctx.fillText(str.substring(lastSubStrIndex, i), initX, initY)
                        initY += lineHeight
                        lineWidth = 0
                        lastSubStrIndex = i
                    }
                    if (i === str.length - 1) {
                        ctx.fillText(str.substring(lastSubStrIndex, i + 1), initX, initY)
                    }
                }
            },
            drawTextToCanvas() {
                if (this.currentText && this.currentText.length !== 0) {
                    this.countOffset()
                    let ctx = this.ctx
                    let fontSize = this.textStyle.fontSize / this.scale * getDpr()
                    let {x, y} = this.getPointByClientPoint({clientX: this.textMsg.offsetLeft, clientY: this.textMsg.offsetTop + this.offsetTop})
                    fontSize = parseInt(fontSize)
                    ctx.font = `bold ${fontSize}px arial`
                    ctx.textAlign = 'left'
                    ctx.textBaseline = 'top'
                    ctx.fillStyle = this.textStylePx.color
                    let lineHeight = this.textStyle.lineHeight / this.scale * getDpr() // 文字的高度
                    this.canvasTextAutoLine(this.currentText, ctx, x, y, lineHeight)
                    this.showText = false
                    this.currentText = ''
                }
            },
            moveMousemoveHandler(e) {
                if (this.moveMouseIsDown) {
                    this.moveMove(e.clientX, e.clientY)
                }
            },
            moveMousedownHandler() {
                this.moveMouseIsDown = true
            },
            moveMouseupHandler() {
                this.moveMouseIsDown = false
            },
            moveMove(clientX, clientY) {
                let added = 40
                // 获取文字高宽
                let textW = this.textMsg.clientWidth / 2
                let textH = this.textMsg.clientHeight / 2
                this.countOffset()
                this.textStyle.top = clientY - this.textStyle.lineHeight - added
                this.textStyle.left = clientX - textW
                let x = clientX + textW
                let y = clientY + textH
                this.textOffset = {clientY: (clientY - textH), clientX: (clientX - textW)}
                if (this.isPC) {
                    this.textOffset = {clientY: y, clientX: x}
                }
            },
            moveTouchMove(e) {
                let {clientX, clientY} = e.touches[0]
                this.moveMove(clientX, clientY)
            },
            down(e) {
                this.mouseIsDown = true
                this.currCtx.draw(this.getPointByClientPoint(e))
            },
            mouseMove(e) {
                if (this.mouseIsDown) {
                    this.currCtx.draw(this.getPointByClientPoint(e), 'move')
                }
            },
            mouseUp() {
                this.mouseIsDown = false
            },
            start(e) {
                this.currCtx.draw(this.getPoint(e), 'start')
            },
            move(e) {
                this.currCtx.draw(this.getPoint(e), 'move')
            },
            end(e) {
                if (this.currCtx.setting.type === 'rect') {
                    let {x, y} = this.getPoint(e)
                    let rect = {
                        startPoint: {
                            x: this.currCtx.startPoint.x,
                            y: this.currCtx.startPoint.y
                        },
                        endPoint: {
                            x: x,
                            y: y
                        },
                        color: this.setting.color
                    }
                    this.currCtx.rectList.push(rect)
                }
            },
            imageLoad(img) {
                return new Promise((resolve, reject) => {
                    let imgDom = new Image()
                    imgDom.onload = () => {
                        if (imgDom.complete) {
                            resolve(imgDom)
                        }
                    }
                    imgDom.onerror = (e) => {
                        reject(e)
                    }
                    imgDom.crossOrigin = '*'
                    imgDom.src = img.imgUrl + `?t=${Date.now}`
                })
            },
            async imageInit() {
                try {
                    let imgDom = await this.imageLoad(this.img)
                    this.imgCanvas = this.$refs.imageCanvas
                    let {clientWidth: innerWidth, clientHeight: innerHeight} = this.imgCanvas.parentElement // 画布的高宽
                    let imgCtx = this.imgCanvas.getContext('2d')
                    let scale = innerWidth / imgDom.width
                    let scaleHeight = imgDom.height * scale
                    this.ctx = imgCtx
                    if (scaleHeight > innerHeight) { // 如果百分百宽之后高超过画布高 则以高为基准
                        scale = innerHeight / imgDom.height
                        scaleHeight = imgDom.height * scale
                    }
                    let scaleWidth = imgDom.width * scale
                    this.imgCanvas.width = innerWidth
                    this.imgCanvas.height = innerHeight
                    this.scale = scale
                    imgCtx.scale(scale, scale)
                    imgCtx.drawImage(imgDom, (innerWidth - scaleWidth) / 2 / scale, (innerHeight - scaleHeight) / 2 / scale)
                } catch (e) {
                    this.$emit('error', e)
                } finally {
                }
            },
            async init() {
                await this.imageInit()
                // 清除文字
                this.currentText = ''
                this.showText = false
                this.setting.type = 'line'
                this.setting.color = '#ff2b2b'
                this.drawLineCtx = new DrawCanvas({
                    canvas : this.$refs.drawCanvasLine,
                    setting: {
                        type     : 'line',
                        lineWidth: this.setting.baseLineWidth,
                        color    : this.setting.color,
                    },
                    scale: this.scale,
                })
                this.drawRectCtx = new DrawCanvas({
                    canvas : this.$refs.drawCanvasRect,
                    setting: {
                        type     : 'rect',
                        lineWidth: this.setting.baseLineWidth,
                        color    : this.setting.color,
                    },
                    scale: this.scale,
                })
                this.currCtx = this.drawLineCtx
            }
        }
    }
</script>
<style lang="less" rel="stylesheet/less">
    @import "../../assets/style/font/iconfont.css";
    .edit-image-dialog{
        .weui-dialog{
            max-width: 100%;
            width: 100%;
            border-radius: 0 !important;
        }
        .zIndex{
            z-index: 999;
        }
    }
    .input-text{
        position: absolute;
        height: 100%;
        width: 100%;
        top: 0;
        left: 0;
        .mask{
            position: absolute;
            height: 100%;
            width: 100%;
            z-index: 9;
        }
        span{
            left: 50%;
            top: 50%;
            cursor: move;
            padding:5/@base 10/@base;
            position: absolute;
            text-align: center;
            z-index: 99;
            &.active{
                border: 1px solid #fff;
                box-shadow:inset 3px -4px 10px 0px rgba(0, 0, 0, 0.3), -1px -4px 10px 1px rgba(0, 0, 0, 0.4);
            }
        }
    }
    .input-text-editor{
        position: absolute;
        width: 100%;
        height: 100%;
        text-align: left;
        top: 0;
        z-index: 99999;
        .text-container{
            position: relative;
            height: 100%;
            padding: 30/@base;
            background-color: rgba(0,0,0,.8);
            .btns{
                padding-bottom: 40/@base;
                span{
                    color: #fff;
                    &.complete{
                        color: #0BB20C;
                        float: right;
                    }
                }
            }
            &>textarea{
                background-color: rgba(0,0,0,0);
                padding: 0;
                margin: 0;
                border: 0;
                outline: none;
                color: #fff;
                display: block;
                width: 100%;
                height: 400/@base;
                resize: none;
                cursor: move;
                font-weight: 400;
                &:focus{
                    background-color: rgba(0,0,0,.2);
                }
            }
        }
        .iconfont{
            font-size: 1.8em;
            color: #000;
            margin-right: @global-padding;
        }
    }
    .edit-image-container{
        height: 100vh;
        background: #333;
        @header-height: 9vh;
        @canvas-height: 83vh;
        @other-heigth: 100 - @header-height - @canvas-height;
        .edit-header{
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #333;
            color: #fff;
            &>span{
                display: block;
                font-size: 1.2em;
                height: @header-height;
                line-height: @header-height;
                padding: 0 @global-padding;
                &.btn{
                    color: @primary-color;
                }
            }
        }
        .canvas-container{
            position: relative;
            height: @canvas-height;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: auto;
            canvas{
                position: absolute;
                left: 0;
                top: 0;
            }
        }
        .color-chose{
            color: #fff;
            height: @other-heigth;
            display: flex;
            align-items: center;
            justify-content: space-around;
            &>div{
                flex: 1;
                display: flex;
                justify-content: center;
            }
            .color-item{
                display: block;
                @size: @other-heigth / 2;
                width: @size;
                height: @size;
                border-radius: 50%;
                &.active{
                    border: 1vw solid #fff;
                }
            }
            .rect{
                span{
                    border: 1px solid #fff;
                    display: inline-block;
                    width: 40/@base;
                    height: 30/@base;
                    &.active{
                        border-color: @primary-color;
                    }
                }
            }
            .line{
                span{
                    display: inline-block;
                    background-color: #fff;
                    width: 4/@base;
                    height: 30/@base;
                    &.active{
                        background-color: @primary-color;
                    }
                }
            }
            i{
                &.active{
                    color: @primary-color;
                }
            }
        }
    }
</style>
