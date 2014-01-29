'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('PhoneCat App', function() {

  it('should redirect index.html to /showCharges', function() {
    browser().navigateTo('/index.html');
    expect(browser().location().url()).toBe('/showCharges');
  });


  describe('Phone list view', function() {

    beforeEach(function() {
      browser().navigateTo('/showCharges');
    });


    it('initial check for loading data', function() {
      expect(repeater('.chargeList tr').count()).toBeGreaterThan(20);


/*      input('query').enter('nexus');
      expect(repeater('.phones li').count()).toBe(1);

      input('query').enter('motorola');
      expect(repeater('.phones li').count()).toBe(8);*/
    });

    describe('category filtering', function(){
      var initCount = -1;
      it('save init count', function(){
        element('.chargeList tbody').query(function($el, done){
          initCount = $el.children().length;
          done();
        });
      });

      it('choose new category Еда', function(){
        select('selectedCategory').option('Еда');
        element('.filterButton').query(function($el, done){
          $el.click();
          done();
        });
      });
      
      it('should be less then init value', function(){
        // expect(input('selectedCategory')).toBe('Еда');
        expect(repeater('.chargeList tr').count()).toBeLessThan(initCount);
      })

    })


  });


});
