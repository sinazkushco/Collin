<div class="cart-promocode-list-item">
	<div class="cart-summary-discount-applied">
        {{#each tariffMapping}}
			<p class="cart-summary-grid-float">{{tariff}}</p>
            <span class="cart-summary-discount-applied">
                <p class="cart-summary-grid-float">
                    <span class="cart-summary-amount-discount-total">{{amount_formatted}}</span>
                    {{line}}
                </p>
            </span>
        {{/each}}
	</div>
</div>
