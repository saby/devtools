define(['Profiler/_utils/Utils'], function(Utils) {
   describe('formatTime', function() {
      const formatTime = Utils.formatTime;
      it('should properly format time higher than a second', function (){
         assert(formatTime(1001), '1s');
      });
   })
});
