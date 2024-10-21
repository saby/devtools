define(['injection/_dependencyWatcher/data/sort/name'], function(name) {
   name = name.default;

   describe('injection/_dependencyWatcher/data/sort/name', function() {
      it('should correctly sort by name (ignoring prefixes)', function() {
         assert.equal(
            name({ name: 'Application' }, { name: 'Application' }),
            0
         );
         assert.isAbove(
            name({ name: 'Bpplication' }, { name: 'Application' }),
            0
         );
         assert.isBelow(
            name({ name: 'Application' }, { name: 'Bpplication' }),
            0
         );

         assert.equal(
            name({ name: 'css!Application' }, { name: 'Application' }),
            0
         );
         assert.isAbove(
            name({ name: 'css!Bpplication' }, { name: 'Application' }),
            0
         );
         assert.isBelow(
            name({ name: 'css!Application' }, { name: 'Bpplication' }),
            0
         );

         assert.equal(
            name({ name: 'css!theme?Application' }, { name: 'Application' }),
            0
         );
         assert.isAbove(
            name({ name: 'css!theme?Bpplication' }, { name: 'Application' }),
            0
         );
         assert.isBelow(
            name({ name: 'css!theme?Application' }, { name: 'Bpplication' }),
            0
         );

         assert.equal(
            name({ name: 'Application' }, { name: 'css!Application' }),
            0
         );
         assert.isAbove(
            name({ name: 'Bpplication' }, { name: 'css!Application' }),
            0
         );
         assert.isBelow(
            name({ name: 'Application' }, { name: 'css!Bpplication' }),
            0
         );

         assert.equal(
            name({ name: 'Application' }, { name: 'css!theme?Application' }),
            0
         );
         assert.isAbove(
            name({ name: 'Bpplication' }, { name: 'css!theme?Application' }),
            0
         );
         assert.isBelow(
            name({ name: 'Application' }, { name: 'css!theme?Bpplication' }),
            0
         );
      });
   });
});
