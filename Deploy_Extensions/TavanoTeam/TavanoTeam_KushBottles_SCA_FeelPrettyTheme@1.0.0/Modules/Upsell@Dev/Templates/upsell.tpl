{{#if upsellItems}}
<div class="upsell-banner-container">
    <div class="upsell-banner">
        <h2 class="upsell-banner-title">
            <span class="upsell-banner-title-text">Bundle and Save!</span>
            <span class="upsell-banner-description">Add items below for additional savings!</span>
        </h2>
    </div>
</div>
{{#each upsellItems}}
<h2 class="upsell-slider-category-title">
    <span class="upsell-slider-category-title-text">{{NAME}}</span>
    <span class="upsell-slider-category-title-caption">Add at least ${{../bundleSavings}} from this category to increase savings on your entire order!</span>
</h2>
<div class="upsell-main-selector-container">
  <p class="upsell-details-slider-left"><a class="prev" href=""></a></p>
  <div class="upsell-accessory-options-container">
    <div class="upsell-slider">
    {{#each this.items}}
      <label class="upsell-accessory-options">
        <span class="upsell-accessory-option-img">
            <a href="{{URL}}" target="_blank" rel="noopener">
                <img class="upsell-img" src="{{IMAGE}}" alt="">
            </a>
        </span>
        <h4 class="upsell-accessory-option-title"><a href="{{URL}}" target="_blank" rel="noopener">{{NAME}}</a></h4>
      </label>
    {{/each}}
    </div>
  </div>
  <p class="upsell-details-slider-right"><a class="next" href=""></a></p>
</div>
{{/each}}
{{/if}}
