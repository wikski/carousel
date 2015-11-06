'use strict';

(function(global, undefined){

	/* TODO
		1. browser transform prefixes
		2. check against sizzle for fastest selector method
		3. goToSlide(-1) should go to last slide
	*/

	var Carousel = global.Carousel || {}

	Carousel = (function(e){

		var _ = this;

		var 
			internals;

		this.defaults = {
			slidesToDisplay: 1,
			activeSlideClass: 'active-slide',
			loop: false,
			draggable: true
		}

		this.internals = {
			rootElement: document.querySelector(e),
			slideTrack: null,
			slides: null,
			trackWidth: 0,
			transitionEnd: transitionSelect(),
			events : {
				beforeSlide: 	new Event('beforeSlide'),
				afterSlide: 	new Event('afterSlide')
			}
		}

		// render
		
		var 
			originalMarkup,
			newMarkup;
				
		/* HTML WRAPPING
		------------------------------- */
		originalMarkup = this.internals.rootElement.innerHTML;
		newMarkup = ['<div class="carousel-track">', originalMarkup, '</div>'].join('');
		this.internals.rootElement.innerHTML = newMarkup;
		
		/* STORE SLIDES		 
		------------------------------- */				
		this.internals.slides = [].slice.call(this.internals.rootElement.children[0].children);
		this.internals.slideTrack = this.internals.slides[0].parentNode;

		for(var i = 0, l = this.internals.slides.length; i < l; i++){
			this.internals.trackWidth += this.internals.slides[i].offsetWidth;
		}
		
		/* CAROUSEL TRACK
		------------------------------- */
		this.internals.slideTrack.style.width = this.internals.trackWidth + 'px';

		/* ATTACH TRANSITION END EVENTS
		------------------------------- */
		this.internals.slideTrack.addEventListener(this.internals.transitionEnd, function(e){			
			_.updateSlides();			
		}, false);	

		if(this.defaults.draggable){
			this.swipe();
		}

		return Carousel;
		
	})();

	Carousel.prototype.getCurrentSlideIndex = function(){
		for(var i = 0, l = this.internals.slides.length; i < l; i++){			
			if(this.internals.slides[i].classList.contains('active-slide')){				
				return i;
			}
		}
	}

	Carousel.prototype.getSlideDirection = function(current, target){
		return current < target ? 'next' : 'prev';		
	}

	Carousel.prototype.goToSlide = function(target){

		// prev or next
		if(typeof target === 'string'){
			
			if(target === 'next' && this.getCurrentSlideIndex() < this.internals.slides.length - 1){

				this.changeSlide(this.getCurrentSlideIndex() + 1);

			} 
			else if(target === 'prev'){

				if(this.defaults.loop && this.getCurrentSlideIndex() === 0){
					this.changeSlide(this.internals.slides.length - 1);
				}
				else {
					this.changeSlide(this.getCurrentSlideIndex() - 1);
				}
			}			
		}
		else if(typeof target === 'number')
		{
			// if we're not on the same slide, or out of range
			if(target !== this.getCurrentSlideIndex() && target >= 0 && target <= this.internals.slides.length - 1){
			
				if(target === -1){
					this.changeSlide(this.internals.slides.length - 1);
				}
				else if(target >= 0 && target <= this.internals.slides.length - 1){
					this.changeSlide(target);
				}
				else {
					console.log('slide index must be between 0 and ' + Number(this.internals.slides.length - 1) )
				}
			}
		}	
	}

	Carousel.prototype.changeSlide = function(target){
		
		var delta;		

		if(target === 0){
			delta = target;
		} 
		else if(target === this.internals.slides.length - 1){
			delta = -Math.abs(this.internals.trackWidth - this.internals.rootElement.offsetWidth);
		} 
		else {			

			delta = 0;	

			for(var i = 0, l = target; i < l; i++){
				delta += this.internals.slides[i].offsetWidth;
			}

			delta = -Math.abs(delta);
		}		

		this.internals.rootElement.dispatchEvent(this.internals.events.beforeSlide);
		this.internals.slideTrack.style.transition = 'transform 500ms ease-in-out';
		this.internals.slideTrack.style.webkitTransform = 'translate3d(' + delta + 'px, 0px, 0px)';
	}

	Carousel.prototype.updateSlides = function(){
		// update classes
		this.internals.rootElement.querySelector('.' + this.defaults.activeSlideClass).classList.remove(this.defaults.activeSlideClass);
		console.log(_.getCurrentSlideIndex())
		this.internals.slides[_.getCurrentSlideIndex()].classList.add(this.defaults.activeSlideClass);
		// remove inline styles
		this.internals.slideTrack.style.removeProperty('transition');
		// dispatch event
		this.internals.rootElement.dispatchEvent(this.internals.events.afterSlide);
	}

	Carousel.prototype.element = function(){
		return this.internals.rootElement;
	}

	Carousel.prototype.swipe = function(){

		var 
			_this 		= this,
			figure 		= document.getElementById('x'),							 	
			startPos 	= null,
			delta 		= null,
			threshold	= 5;
		
		for(var i = 0, l = this.internals.slides.length; i < l; i++){
			this.internals.slides[i].children[0].addEventListener('mousedown', startDrag);		
		}

		function startDrag(e){						
			this.addEventListener('mouseup', stopDrag);
			this.addEventListener('mouseout', stopDrag);
			this.addEventListener('mousemove', dragging);
		}

		function dragging(e){			
			delta = startPos - e.pageX;
			if(startPos === null){
				startPos = e.pageX;
				_this.internals.slideTrack.style.transition = 'transform 150ms ease-out';
			}
			if(e.pageX !== startPos){
				delta = delta * -1;				
				_this.internals.slideTrack.style.transform = 'translate3d(' + delta + 'px, 0, 0)';								
			}			
		}

		function stopDrag(e){
			this.removeEventListener('mouseup', stopDrag);
			this.removeEventListener('mouseout', stopDrag);
			this.removeEventListener('mousemove', dragging);			
			if(Math.abs(figure.offsetWidth / (10 / threshold)) < Math.abs(delta)){
				if(delta < 0){
					_this.goToSlide('next');
				}
				else
				{
					_this.goToSlide('prev');
				}
			}
			else
			{
				_this.internals.slideTrack.style.transform = 'translate3d(0, 0, 0)';
			}			
			startPos = null;
			delta = null;
		}
	
	}
	
	/* UTILITY FUNCTIONS
	------------------------------- */
	function transitionSelect(){
    	var el = document.createElement("div");
    	if (el.style.WebkitTransition) return "webkitTransitionEnd";
    	if (el.style.OTransition) return "oTransitionEnd";
    	return 'transitionend';
	}
	

})(window, undefined);