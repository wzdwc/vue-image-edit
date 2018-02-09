export default class DrawCanvas {
    constructor(config) {
        this.canvas = config.canvas
        this.setting = config.setting
        this.scale = config.scale
        this.startPoint = {x: 0, y: 0}
        this.rectPoint = []
        this.ctx = {}
        this.init()
    }
    saveImage() {
        return this.canvas.toDataURL('image/png')
    }
    draw({ x, y }, type = 'start') {
        let ctx = this.ctx
        switch (type) {
        case 'start':
            if (this.setting.type === 'line') {
                this.drawLine(ctx, {x, y})
            }
            this.startPoint.x = x
            this.startPoint.y = y
            break
        case 'move':
            if (this.setting.type === 'line') {
                ctx.lineTo(x, y)
            }
            if (this.setting.type === 'rect') {
                this.canvasInit()
                // 是否已经画过
                if (this.rectPoint.length !== 0) {
                    this.rectPoint.forEach(rect => {
                        this.drawRect(ctx, rect.startPoint, rect.endPoint)
                    })
                }
                this.drawRect(ctx, this.startPoint, {x, y})
            }
            break
        }
        ctx.stroke()
    }
    drawRect(ctx, startPoint, endPoint) {
        ctx.lineWidth = this.setting.lineWidth
        ctx.strokeStyle = this.setting.color
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.rect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y)
        ctx.stroke()
    }
    drawLine(ctx, {x, y}) {
        ctx.lineWidth = this.setting.lineWidth
        ctx.strokeStyle = this.setting.color
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.fill()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y)
    }
    clearCanvas() {
        let cxt = this.canvas.getContext('2d')
        cxt.clearRect(0, 0, this.canvas.width / this.scale, this.canvas.height / this.scale)
    }
    canvasInit() {
        let {clientWidth: innerWidth, clientHeight: innerHeight} = this.canvas.parentElement // 画布的高宽
        let ctx = this.canvas.getContext('2d')
        this.ctx = ctx
        this.clearCanvas()
        this.canvas.width = innerWidth
        this.canvas.height = innerHeight
        ctx.scale(this.scale, this.scale)  // todo 是否需要进行缩放，是否在外层处理
    }
    init() {
        this.showText = false
        this.rectPoint = []
        this.clearCanvas()
        this.canvasInit()
    }
}
