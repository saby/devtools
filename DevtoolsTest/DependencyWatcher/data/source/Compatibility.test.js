define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/source/Compatibility'
], function(mockChrome, Compatibility) {
   let instance;
   Compatibility = Compatibility.Compatibility;

   describe('DependencyWatcher/_data/source/Compatibility', function() {
      beforeEach(function() {
         instance = new Compatibility({
            idProperty: 'test'
         });
      });

      afterEach(function() {
         instance = undefined;
      });

      it('should set options', function() {
         const options = {
            test: 123
         };
         instance._opt = undefined;

         instance.setOptions(options);

         assert.equal(instance._opt, options);
      });

      it('should return saved options', function() {
         const options = {
            test: 123
         };
         instance._opt = options;

         assert.equal(instance.getOptions(), options);
      });

      it('should return empty object because the options were not set', function() {
         instance._opt = undefined;

         assert.deepEqual(instance.getOptions(), {});
      });

      it('should return keyProperty', function() {
         assert.equal(instance.getKeyProperty(), 'test');
      });

      it('should return default model name', function() {
         assert.equal(instance.getModel(), 'Types/entity:Model');
      });

      it('should return adapter', function() {
         const adapter = {};
         instance._adapter = adapter;

         assert.equal(instance.getAdapter(), adapter);
      });

      it('should reject read with error', async function() {
         try {
            await instance.read();
         } catch (error) {
            assert.equal(error.message, 'Not implemented');
         }
      });

      it('should reject create with error', async function() {
         try {
            await instance.create();
         } catch (error) {
            assert.equal(error.message, 'Not implemented');
         }
      });

      it('should reject update with error', async function() {
         try {
            await instance.update();
         } catch (error) {
            assert.equal(error.message, 'Not implemented');
         }
      });

      it('should reject delete with error', async function() {
         try {
            await instance.delete();
         } catch (error) {
            assert.equal(error.message, 'Not implemented');
         }
      });
   });
});
