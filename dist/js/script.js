const settings = {
    min: 0,
    orange: 65,
    red: 80,
    max: 100
};

(function () {

    Chart.defaults.global.legend.display = false;
    Chart.defaults.global.tooltips.enabled = false;
    Chart.defaults.global.hover.mode = null;

    Chart.pluginService.register({
        beforeDraw: function(chart) {
            var width = chart.chart.width,
                height = chart.chart.height,
                ctx = chart.chart.ctx,
                type = chart.config.type;


            if(type == 'line'){
                var min = Math.min(...chart.config.data.datasets[0].data);
                var max = Math.max(...chart.config.data.datasets[0].data);

                if( max - min >= 1){
                    console.log("real");
                    chart.config.options.scales.yAxes[0].ticks.stepSize = max;
                    chart.config.options.scales.yAxes[0].ticks.max = max;
                    chart.config.options.scales.yAxes[0].ticks.min = min;
                }else{
                    console.log("unreal");
                    chart.config.options.scales.yAxes[0].ticks.stepSize = max + 1;
                    chart.config.options.scales.yAxes[0].ticks.max = max + 1;
                    chart.config.options.scales.yAxes[0].ticks.min = Math.max(min, 0) ;
                }


                chart.update()
            }

            if (type == 'doughnut')
            {
                // var percent = Math.round((chart.config.data.datasets[0].data[0] * 100) /
                //     (chart.config.data.datasets[0].data[0] +
                //         chart.config.data.datasets[0].data[1]));

                let percent = chart.config.data.datasets[0].data[0]


                var oldFill = ctx.fillStyle;
                var fontSize = (height / 4 ).toFixed(2);

                ctx.restore();
                ctx.textBaseline = "middle"

                var value = percent%1 ? percent.toFixed(1) : percent;


                let textX = Math.round((width - ctx.measureText(value).width) / 2),
                    textY = (height + chart.chartArea.top) / 2;

                ctx.font = fontSize/3 + "px sans-serif";
                ctx.fillStyle = "#FFF";

                let text_name = chart.canvas.getAttribute('data-name')
                ctx.fillText(text_name, Math.round((width - ctx.measureText(text_name).width) / 2), textY - height/5)

                let text_unit = chart.canvas.getAttribute('data-unit')
                ctx.fillText(text_unit, Math.round((width - ctx.measureText(text_unit).width) / 2), textY + height/4)

                ctx.font = fontSize + "px sans-serif";
                ctx.fillStyle = chart.config.data.datasets[0].backgroundColor[0];
                ctx.fillText(value, textX, textY + height/30);
                ctx.fillStyle = oldFill;

                if(chart.canvas.getAttribute('data-border') === 'margins'){
                    if(percent < chart.config.options.breakpoints.orange){
                        chart.config.data.datasets[0].backgroundColor[0] = 'rgba(0, 255, 30, 1)'
                    }
                    if(percent > chart.config.options.breakpoints.orange){
                        chart.config.data.datasets[0].backgroundColor[0] = 'rgba(255, 255, 30, 1)'
                    }
                    if(percent > chart.config.options.breakpoints.red){
                        chart.config.data.datasets[0].backgroundColor[0] = 'rgba(255, 0, 0, 1)'
                    }
                }

                chart.update()
            }
        },
        afterDraw: function (chart) {
            var width = chart.chart.width,
                height = chart.chart.height,
                ctx = chart.chart.ctx,
                type = chart.config.type;

            if (type == 'doughnut' && chart.canvas.getAttribute('data-border') === 'margins' ) {

                let doughnutlenght = chart.chart.config.options.circumference;

                let lineWidth = chart.radiusLength / 4;
                ctx.lineWidth = lineWidth;

                //green path
                ctx.strokeStyle = "#00ff1e";
                ctx.beginPath();
                ctx.arc(width / 2, (height / 2) + height / 21.05, chart.chart.controller.outerRadius - lineWidth / 2, chart.chart.config.options.rotation, chart.chart.config.options.rotation + chart.chart.config.options.circumference * chart.chart.config.options.breakpoints.orange / 100 );
                ctx.stroke();

                //yellow path
                ctx.strokeStyle = "#FFFF00";
                ctx.beginPath();
                ctx.arc(width / 2, (height / 2) + height / 21.05, chart.chart.controller.outerRadius - lineWidth / 2, chart.chart.config.options.rotation + chart.chart.config.options.circumference * chart.chart.config.options.breakpoints.orange / 100, chart.chart.config.options.circumference * 0.10);
                ctx.stroke();

                //red path
                ctx.strokeStyle = "#FF0000";
                ctx.beginPath();
                ctx.arc(width / 2, (height / 2) + height / 21.05, chart.chart.controller.outerRadius - lineWidth / 2, chart.chart.config.options.rotation + chart.chart.config.options.circumference * chart.chart.config.options.breakpoints.red / 100, chart.chart.config.options.rotation + chart.chart.config.options.circumference );
                ctx.stroke();


                let spaceWidth = chart.radiusLength / 6;
                ctx.strokeStyle = "#000"; //red
                ctx.lineWidth = 4
                ctx.beginPath();
                ctx.arc(width / 2, (height / 2) + height / 21.05, chart.chart.controller.outerRadius - lineWidth / 2 - spaceWidth / 1.5, chart.chart.config.options.rotation, chart.chart.config.options.rotation + chart.chart.config.options.circumference);
                ctx.stroke();

                ctx.save();
            }
        }
    });

    MobroSDK.init();

    let charts = initCharts();

    MobroSDK.addChannelListener('general_processor_temperature', (data) => {
        charts.cpuTemp.chart.data.datasets[0].data[0] = parseFloat(data.payload.value)
        charts.cpuTemp.chart.data.datasets[0].data[1] =  parseFloat(data.payload.value - settings.max)
    })
    const cpuLoad = document.getElementById('cpu-current-load')
    MobroSDK.addChannelListener('general_processor_usage', (data) => {
        charts.cpuLoad.chart.data.datasets[0].data.push(parseInt(data.payload.value))
        charts.cpuLoad.chart.data.datasets[0].data.shift();

        cpuLoad.innerHTML = parseInt(data.payload.value);

        charts.cpuLoad.chart.config.data.labels.push(+ new Date())
        charts.cpuLoad.chart.config.data.labels.shift();


        var min = Math.min(...charts.cpuLoad.chart.config.data.datasets[0].data);
        var max = Math.max(...charts.cpuLoad.chart.config.data.datasets[0].data);
    })



    MobroSDK.addChannelListener('general_graphics_temperature', (data) => {
        charts.gpuTemp.chart.data.datasets[0].data[0] = parseFloat(data.payload.value)
        charts.gpuTemp.chart.data.datasets[0].data[1] =  parseFloat(data.payload.value - settings.max)
    })

    const gpuLoad = document.getElementById('gpu-current-load')
    MobroSDK.addChannelListener('general_graphics_usage', (data) => {
        charts.gpuLoad.chart.data.datasets[0].data.push(parseInt(data.payload.value))
        charts.gpuLoad.chart.data.datasets[0].data.shift();

        gpuLoad.innerHTML = parseInt(data.payload.value);

        charts.gpuLoad.chart.config.data.labels.push(+ new Date())
        charts.gpuLoad.chart.config.data.labels.shift();
    })



    MobroSDK.addChannelListener('general_memory_usage', (data) => {
        charts.ramUsage.chart.data.datasets[0].data[0] = parseFloat(data.payload.value)
        charts.ramUsage.chart.data.datasets[0].data[1] =  parseFloat(100 - data.payload.value)
        memoryData.innerHTML = parseFloat(data.payload.value) + '/' + parseFloat(data.payload.max);
    })

    const memoryData = document.getElementById('mobro-ram-data--used')
    MobroSDK.addChannelListener('general_memory_used', (data) => {
        memoryData.innerHTML = parseFloat(data.payload.value).toFixed(2);
    })


    MobroSDK.emit("monitor:hardware").then((data) => {

        console.log("general data", data);

        document.getElementById("mobro-cpu-name").innerHTML = data.processor.name
        document.getElementById("mobro-gpu-name").innerHTML = data.graphics.name
        document.getElementById("mobro-ram-data--total").innerHTML = data.memory.name
    })

    MobroSDK.emit("monitor:sensor:data", "general_processor_temperature").then((data) => {
        console.log("history data", data)
    })
})()


function initCharts() {
    return {
        "cpuLoad" : createLine(document.getElementById("cpu-chart-line")),
        "cpuTemp" : createDoughnuts(document.getElementById("cpu-chart-doughnut")),

        "gpuLoad" : createLine(document.getElementById("gpu-chart-line")),
        "gpuTemp" : createDoughnuts(document.getElementById("gpu-chart-doughnut")),

        "ramUsage" : createDoughnuts(document.getElementById("ram-chart-doughnut")),
        "vramTemp" : createDoughnuts(document.getElementById("vram-chart-doughnut")),

        "cpuFan" : createClosedDoughnuts(document.getElementById("fan_cpu-chart-doughnut")),
        "gpuFan" : createClosedDoughnuts(document.getElementById("fan_gpu-chart-doughnut")),
    }
}


function createDoughnuts(element) {
    const outlineDoughnutOptions = {
        cutoutPercentage: 75,
        circumference: 1.6 * Math.PI,
        rotation: -( 1.3 * Math.PI),
        breakpoints: {
            min: settings.min,
            orange: settings.orange,
            red: settings.red,
            max: settings.max
        }
    }

    return new Chart(element, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 0],
                backgroundColor: [
                    'rgba(0, 255, 30, 1)',
                    'rgb(80,110,120)',
                ],
                borderWidth: 0
            }]
        },
        options: outlineDoughnutOptions,
    })
}

function createClosedDoughnuts(element) {
    const outlineDoughnutOptions = {
        cutoutPercentage: 75,
    }

    return new Chart(element, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [2, 1],
                backgroundColor: [
                    'rgba(0, 255, 255, 1)',
                    'rgb(80,110,120)',
                ],
                borderWidth: 0
            }]
        },
        options: outlineDoughnutOptions,
    })
}

function createLine(element,interpolate = false) {
    const animation = {
        duration: 750,
        easing: 'linear'
    };

    const lineOptions = {
        tooltips: {enabled: false},
        hover: {mode: null},
        animation: animation,
        cubicInterpolationMode : interpolate,
        scales: {
            xAxes: [{
                display: false, // mandatory
                scaleLabel: {
                    display: true, // mandatory
                    labelString: 'Your label' // optional
                },
            }],
            yAxes: [{
                display: true,
                gridLines: {
                    display: false,
                    drawBorder: false
                },
                ticks: {
                    mirror: true,
                }
            }]
        }
    }



    return new Chart(element, {
        type: 'line',
        data: {
            labels: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],
            datasets: [{
                lineTension: 0,
                data: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                borderColor: 'rgba(15, 150, 200, 1)',
                borderWidth: 2,
                pointRadius: '0',
                fill: false
            }]
        },
        options: lineOptions

    })
}