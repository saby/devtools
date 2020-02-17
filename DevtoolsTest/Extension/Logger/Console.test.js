define(['Extension/Logger/Console'], function(ConsoleLogger) {
   let instance;
   let sandbox;
   ConsoleLogger = ConsoleLogger.ConsoleLogger;

   describe('Extension/Logger/Console', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      beforeEach(function() {
         instance = new ConsoleLogger('testLogger');
      });

      afterEach(function() {
         instance = undefined;
      });

      const consoleMethods = ['log', 'warn', 'error'];

      consoleMethods.forEach((method) => {
         it(`should call console.${method}`, function() {
            sandbox.stub(console, method);

            instance[method]('test message');

            sinon.assert.calledWithExactly(
               console[method],
               'testLogger: ',
               'test message'
            );
         });
      });

      it('should create new instance with the passed name', function() {
         const newInstance = instance.create('test name');

         assert.notEqual(newInstance, instance);
         assert.equal(newInstance._name, 'testLogger/test name');
      });
   });
});
