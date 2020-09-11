/**
 * Licensed Materials - Property of IBM
 * 
 * Copyright IBM Corp. 2019 All Rights Reserved.
 * 
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

 // D3 base chart source http://bl.ocks.org/brattonc/5e5ce9beee483220e2f6

import { RenderBase, UpdateInfo, CatPalette, DataSet, DataPoint, Color } from "@businessanalytics/customvis-lib";
import * as d3 from "https://d3js.org/d3.v5.min.js";

export default class extends RenderBase
{
    // Create is called during initialization
    protected create( _node: HTMLElement ): Element
    {
         // Create SVG node return the container
          return d3.select( _node ).append( "svg" )
            .attr( "width", "100%" )
            .attr( "height", "100%" )
            .node();
    }

    // Update is called during new data, property change, resizing, etc.
    protected update( _info: UpdateInfo ): void
    {
        const data = _info.data;
        const props = _info.props;
        //Assign ID to div. Random used to make it unique.
        var nodeid = Math.random().toString(36).substr(2, 9);
        _info.node.setAttribute('id', nodeid);    
        var config1 = liquidFillGaugeDefaultSettings();
        //Override properties. Description of properties can be found under liquidFillGaugeDefaultSettings
        config1.minValue = props.get( "min" ); 
        config1.maxValue = props.get("calcPer") ? 100 : props.get("max");
        config1.circleColor = props.get("circle-color");
        config1.textColor = props.get("text-color");
        config1.waveTextColor = props.get("wave-text-color");
        config1.waveColor = props.get("wave-color");
        config1.circleThickness = props.get("thickness");
        config1.textVertPosition = props.get("textPosition");;
        config1.waveAnimateTime = props.get("waveAnimationTime");
        config1.circleFillGap =  props.get("fillGap");
        config1.waveHeight = 0.05; 
        config1.waveCount = props.get("waveCount");
        config1.waveRiseTime = 1000; 
        config1.waveRise = true;
        config1.waveHeightScaling = true;
        config1.waveAnimate = props.get("waveAnimation"); 
        config1.valueCountUp = true;
        config1.displayPercent = props.get("percentage");
        config1.opacity = props.get("fillOpacity");
        config1.font = props.get("labelFont").family;
        var fontSize = props.get("labelFont").size.value == 12 ? 0.5 : props.get("labelFont").size.value == 14 ? 1 : props.get("labelFont").size.value == 16 ? 1.5 : 2;
        config1.textSize = fontSize;
        var gauge1 = loadLiquidFillGauge(nodeid, props.get("calcPer") ? data.rows[ 0 ].value( "value" )*100/props.get( "max" ) : data.rows[ 0 ].value( "value" ) , config1,  _info.node);
    }  
}



function liquidFillGaugeDefaultSettings() {
    return {
        minValue: 0, // The gauge minimum value.
        maxValue: 100, // The gauge maximum value.
        circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
        circleFillGap: 0.05, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
        circleColor: "#178BCA", // The color of the outer circle.
        waveHeight: 0.05, // The wave height as a percentage of the radius of the wave circle.
        waveCount: 1, // The number of full waves per width of the wave circle.
        waveRiseTime: 100, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
        waveAnimateTime: 180, // The amount of time in milliseconds for a full wave to enter the wave circle.
        waveRise: true, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
        waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
        waveAnimate: true, // Controls if the wave scrolls or is static.
        waveColor: "#178BCA", // The color of the fill wave.
        waveOffset: 0, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
        textVertPosition: .5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
        textSize: 1, // The relative height of the text to display in the wave circle. 1 = 50%
        valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
        displayPercent: true, // If true, a % symbol is displayed after the value.
        textColor: "#045681", // The color of the value text when the wave does not overlap it.
        waveTextColor: "#A4DBf8", // The color of the value text when the wave overlaps it.
        opacity: 0.5, // Opacity for both wave and circle
        font : "arial" //Text font
    };
}


function loadLiquidFillGauge(elementId, value, config,  _node) {

    if (config == null) config = liquidFillGaugeDefaultSettings();

    const gauge = d3.select(_node);
    //Destory chart on each refresh
    gauge.selectAll("svg > *").remove();

    let w=gauge.style("width").replace('px','');
    let h=gauge.style("height").replace('px','');

    const radius = Math.min(w, h) / 2;
    const locationX = parseInt(w) / 2 - radius;
    const locationY = parseInt(h) / 2 - radius;

    const fillPercent = Math.max(config.minValue,Math.min(config.maxValue, value)) / config.maxValue;
  
    let waveHeightScale = null;
    if (config.waveHeightScaling) {
        waveHeightScale = d3.scaleLinear()
            .range([0, config.waveHeight, 0])
            .domain([0, 50, 100]);
    } else {
        waveHeightScale = d3.scaleLinear()
            .range([config.waveHeight, config.waveHeight])
            .domain([0, 100]);
    }

   
    const textPixels = (config.textSize * radius / 2);
    const textFinalValue = parseFloat(value).toFixed(2);
    const textStartValue = config.valueCountUp ? config.minValue : textFinalValue;
    const percentText = config.displayPercent ? "%" : "";
    const circleThickness = config.circleThickness * radius;
    const circleFillGap = config.circleFillGap * radius;
    const fillCircleMargin = circleThickness + circleFillGap;
    const fillCircleRadius = radius - fillCircleMargin;
    const waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);

    const waveLength = fillCircleRadius * 2 / config.waveCount;
    const waveClipCount = 1 + config.waveCount;
    const waveClipWidth = waveLength * waveClipCount;

    // Rounding functions so that the correct number of decimal places is always displayed
    // as the value counts up.
    const format = d3.format(".0f");

    // Data for building the clip wave area.
    const data = [];
    for (let i = 0; i <= 40 * waveClipCount; i++) {
        data.push({x: i / (40 * waveClipCount), y: (i / (40))});
    }

    // Scales for drawing the outer circle.
    const gaugeCircleX = d3.scaleLinear().range([0, 2 * Math.PI]).domain([0, 1]);
    const gaugeCircleY = d3.scaleLinear().range([0, radius]).domain([0, radius]);

    // Scales for controlling the size of the clipping path.
    const waveScaleX = d3.scaleLinear().range([0, waveClipWidth]).domain([0, 1]);
    const waveScaleY = d3.scaleLinear().range([0, waveHeight]).domain([0, 1]);

    // Scales for controlling the position of the clipping path.
    const waveRiseScale = d3.scaleLinear()
        // The clipping area size is the height of the fill circle + the wave height,
        // so we position the clip wave such that the it will overlap the fill circle
        // at all when at 0%, and will totally cover the fill circle at 100%.
        .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
        .domain([0, 1]);

    const waveAnimateScale = d3.scaleLinear()
        .range([0, waveClipWidth - fillCircleRadius * 2]) // Push the clip area one full wave then snap back.
        .domain([0, 1]);

    // Scale for controlling the position of the text within the gauge.
    const textRiseScaleY = d3.scaleLinear()
        .range([fillCircleMargin + fillCircleRadius * 2,(fillCircleMargin + textPixels * 0.7)])
        .domain([0, 1]);

    // Center the gauge within the parent SVG.
    const gaugeGroup = gauge.append("g")
        .attr('transform','translate(' + locationX + ',' + locationY + ')');

    // Draw the outer circle.
    const gaugeCircleArc = d3.arc()
        .startAngle(gaugeCircleX(0))
        .endAngle(gaugeCircleX(1))
        .outerRadius(gaugeCircleY(radius))
        .innerRadius(gaugeCircleY(radius - circleThickness));
      
    gaugeGroup.append("path")
        .attr("d", gaugeCircleArc)
        .style("fill", config.circleColor)
        .attr("opacity",config.opacity)
        .attr('transform','translate(' + radius + ',' + radius + ')');

    // Text where the wave does not overlap.
    gaugeGroup.append("text")
        .text(format(textStartValue) + percentText)
        .attr("class", "liquidFillGaugeText")
        .attr("font-family", config.font)
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.textColor)
        .attr('transform','translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');

    // The clipping wave area.
    const clipArea = d3.area()
        .x(function(d) { return waveScaleX(d.x); })
        .y0(function(d) { return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI));})
        .y1(function(d) { return (fillCircleRadius *2 + waveHeight); });
    const waveGroup = gaugeGroup.append("defs")
        .append("clipPath")
        .attr("id", "clipWave" + elementId);
    const wave = waveGroup.append("path")
        .datum(data)
        .attr("d", clipArea)
        .attr("T", 0);

    // The inner circle with the clipping wave attached.
    const fillCircleGroup = gaugeGroup.append("g")
        .attr("clip-path", "url(" + location.href + "#clipWave" + elementId + ")");
     
    fillCircleGroup.append("circle")
        .attr("cx", radius)
        .attr("cy", radius)
        .attr("r", fillCircleRadius)
        .style("fill", config.waveColor)
        .attr("opacity",config.opacity);

    // Text where the wave does overlap.
    fillCircleGroup.append("text")
        .text(format(textStartValue))
        .attr("class", "liquidFillGaugeText")
        .attr("font-family", config.font)
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.waveTextColor)
        .attr('transform','translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');

    // Make the value count up.
    if (config.valueCountUp) {
        gaugeGroup.selectAll("text.liquidFillGaugeText").transition()
            .duration(config.waveRiseTime)
            .tween("text", function(d) {
                var that = d3.select(this)
                var i = d3.interpolateNumber(that.text().replace("%", ""), textFinalValue);
                return function(t) { that.text(format(i(t)) + percentText); };
            });
    }

    // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement
    // can be controlled independently.
    const waveGroupXPosition = fillCircleMargin + fillCircleRadius * 2 - waveClipWidth;
    
    if (config.waveRise) {
        waveGroup.attr('transform','translate(' + waveGroupXPosition + ',' + waveRiseScale(0) + ')')
            .transition()
            .duration(config.waveRiseTime)
            .attr('transform','translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')')
            .on("start", function() { wave.attr('transform','translate(1,0)'); });
            // This transform is necessary to get the clip wave positioned correctly when
            // waveRise=true and waveAnimate=false. The wave will not position correctly without
            // this, but it's not clear why this is actually necessary.
    } else {
        waveGroup.attr('transform','translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')');
    }

    if(config.waveAnimate) animateWave();
 
    function animateWave() {
        wave.attr('transform','translate(' + waveAnimateScale(wave.attr('T')) + ',0)');
        wave.transition()
            .duration(config.waveAnimateTime * (1 - wave.attr('T')))
            .ease(d3.easeLinear)
            .attr('transform','translate(' + waveAnimateScale(1) + ',0)')
            .attr('T', 1)
            .on('end', function() {
                wave.attr('T', 0);
                animateWave();
            });
    }

 
    function GaugeUpdater() {
      
 
        this.setWaveAnimate = function(value) {
            // Note: must call update after setting value
            config.waveAnimate = value;
        }
        this.update = function(value) {
            var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue;

            gaugeGroup.selectAll("text.liquidFillGaugeText").transition()
                .duration(config.waveRiseTime)
                .tween("text", function(d) {
                    var that = d3.select(this)
                    var i = d3.interpolateNumber(that.text().replace("%", ""), fillPercent*100);
                    return function(t) { that.text(format(i(t)) + percentText); };
                });

            var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);
            var waveRiseScale = d3.scaleLinear()
                // The clipping area size is the height of the fill circle + the wave height, so we position
                // the clip wave such that the it will overlap the fill circle at all when at 0%, and will
                // totally cover the fill circle at 100%.
                .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
                .domain([0,1]);
            var newHeight = waveRiseScale(fillPercent);
            var waveScaleX = d3.scaleLinear().range([0, waveClipWidth]).domain([0, 1]);
            var waveScaleY = d3.scaleLinear().range([0, waveHeight]).domain([0, 1]);
            var newClipArea;

            if (config.waveHeightScaling) {
                newClipArea = d3.area()
                    .x(function(d) { return waveScaleX(d.x); } )
                    .y0(function(d) {
                        return waveScaleY(Math.sin(
                            Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI));
                    })
                    .y1(function(d) { return (fillCircleRadius * 2 + waveHeight); });
            } else {
                newClipArea = clipArea;
            }

            var newWavePosition = config.waveAnimate ? waveAnimateScale(1) : 0;
            wave.transition()
                .duration(0)
                .transition()
                .duration(config.waveAnimate ? (config.waveAnimateTime * (1 - wave.attr('T'))) : config.waveRiseTime)
                .ease(d3.easeLinear)
                .attr('d', newClipArea)
                .attr('transform','translate(' + newWavePosition + ',0)')
                .attr('T','1')
                .on("end", function() {
                    if (config.waveAnimate) {
                        wave.attr('transform','translate(' + waveAnimateScale(0) + ',0)');
                       animateWave();
                    }
                });

            waveGroup.transition()
                .duration(config.waveRiseTime)
                .attr('transform','translate(' + waveGroupXPosition + ',' + newHeight + ')')
        }
        
    }
    return new GaugeUpdater();
}

