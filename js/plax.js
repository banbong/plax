/*
  Copyright (c) 2011 Cameron McEfee

  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  "Software"), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function ($) {

  var maxfps     = 25,
      delay      = 1 / maxfps * 1000,
      lastRender = new Date().getTime(),
      layers     = [],
      docWidth   = $(window).width(),
      docHeight  = $(window).height(),
      motionEnabled = false,
      motionAllowance = .05,
      movementCycles  = 0,
      motionData = {
        "xArray"  : [0,0,0,0,0],
        "yArray"  : [0,0,0,0,0],
        "xMotion" : 0,
        "yMotion" : 0
      }
      
  Array.prototype.max = function(){
    return Math.max.apply({},this)
  }
  Array.prototype.min = function(){
    return Math.min.apply({},this)
  }

  $(window).resize(function() {
      docWidth  = $(window).width()
      docHeight = $(window).height()
  })

  // Public Methods
  $.fn.plaxify = function (params){

    return this.each(function () {

      var layer = {"xRange":0,"yRange":0,"invert":false}
      for (var param in params) {
        if (layer[param] == 0) {
          layer[param] = params[param]
        }
      }

      // Add an object to the list of things to parallax
      layer.obj    = $(this)
      layer.startX = this.offsetLeft
      layer.startY = this.offsetTop

      if(layer.invert == false){
        layer.startX -= Math.floor(layer.xRange/2)
        layer.startY -= Math.floor(layer.yRange/2)
      } else {
        layer.startX += Math.floor(layer.xRange/2)
        layer.startY += Math.floor(layer.yRange/2)
      }
      layers.push(layer)
    })
  }

  // Are we on a device with an accelerometer, or are we mouse-based?
  function moveable(){
    return window.DeviceMotionEvent != undefined
  }
  
  function detectMotion(e){
    if (new Date().getTime() < lastRender + delay) return
    
    if(moveable()){
      var accel= e.accelerationIncludingGravity,
          x = accel.x,
          y = accel.y
      if(motionData.xArray.length >= 5){
        motionData.xArray.shift()
      }
      if(motionData.yArray.length >= 5){
        motionData.yArray.shift()
      }
      motionData.xArray.push(x)
      motionData.yArray.push(y)
      
      motionData.xMotion = Math.round((motionData.xArray.max() - motionData.xArray.min())*1000)/1000
      motionData.yMotion = Math.round((motionData.yArray.max() - motionData.yArray.min())*1000)/1000
      
      if(motionData.xMotion > motionAllowance || motionData.yMotion > motionAllowance){
        movementCycles++;
      } else {
        movementCycles = 0;
      }
      
      if(movementCycles >= 5){
        motionEnabled = true
        $(document).unbind('mousemove.plax')
        //window.ondevicemotion = function(e){plaxifier(e)}

        $(window).bind('devicemotion', plaxifier(e))
      } else {
        motionEnabled = false
        $(window).unbind('devicemotion')
        $(document).bind('mousemove.plax', function (e) {
          plaxifier(e)
        })
      }
    }
  }

  function plaxifier(e) {
    if (new Date().getTime() < lastRender + delay) return
      lastRender = new Date().getTime()

    var x = e.pageX,
        y = e.pageY
        
    if(motionEnabled == true){
      var i = (window.orientation +180) %360 / 90, // portrait(%2==0) or landscape
          accel= e.accelerationIncludingGravity,
          tmp_x = i%2==0 ? -accel.x : accel.y,
          tmp_y = i%2==0 ? accel.y : accel.x

      // facing up(>=2) or down
      x = i>=2 ? tmp_x : -tmp_x
      y = i>=2 ? tmp_y : -tmp_y
    }

    var hRatio = x/((motionEnabled == true) ? 5 : docWidth),
        vRatio = y/((motionEnabled == true) ? 5 : docHeight),
        layer, i

    for (i = layers.length; i--;) {
      layer = layers[i]
      if (layer.invert != true) {
        layer.obj
          .css('left',layer.startX + (layer.xRange*hRatio))
          .css('top', layer.startY + (layer.yRange*vRatio))
      } else {
        layer.obj
          .css('left',layer.startX - (layer.xRange*hRatio))
          .css('top', layer.startY - (layer.yRange*vRatio))
      }
    }
  }

  $.plax = {
    enable: function(){
      $(document).bind('mousemove.plax', function (e) {
        plaxifier(e)
      })

      if(moveable()){
        window.ondevicemotion = function(e){detectMotion(e)}
      }

    },
    disable: function(){
      $(document).unbind('mousemove.plax')
      window.ondevicemotion = undefined
    }
  }

  if (typeof ender !== 'undefined') {
    $.ender($.fn, true)
  }

})(function () {
  return typeof jQuery !== 'undefined' ? jQuery : ender
}())
