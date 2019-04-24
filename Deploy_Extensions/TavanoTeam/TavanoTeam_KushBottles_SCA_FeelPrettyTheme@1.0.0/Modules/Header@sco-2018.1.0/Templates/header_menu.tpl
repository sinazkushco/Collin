<nav class="header-menu-secondary-nav">

	<!-- <div class="header-menu-search">
		<button class="header-menu-search-link" data-action="show-sitesearch" title="{{translate 'Search'}}">
			<i class="header-menu-search-icon"></i>
		</button>
	</div> -->

	<ul class="header-menu-level1">
		{{#each categories}}
			{{#if text}}
				<li {{#if categories}}data-toggle="categories-menu"{{/if}}>
					<a class="{{class}}" {{objectToAtrributes this}}>{{translate text}}</a>

					{{#if categories}}
					
					<ul class="header-menu-level-container {{#if thumbnailurl}}wbanner{{/if}}">
						<li>
							<ul class="header-menu-level2">
								<div class="links-section">
									{{#each categories}}
									<li>
										<a class="{{class}}" {{objectToAtrributes this}}>
											{{translate text}}
										</a>
										{{#if categories}}
										<ul class="header-menu-level3">
											{{#each categories}}
											<li>
												<a class="{{class}}" {{objectToAtrributes this}}>{{translate text}}</a>
											</li>
											{{/each}}
										</ul>
										{{/if}}
									</li>
									<li class="menu-divider">&nbsp;</li>
									{{/each}}
								</div>


									<div class="banner-section">
										<img class="header-menu-image" src="https://www.kushsupplyco.com/c.4516274/Images/Home/slider/slider1.jpg?resizeid=5&resizeh=500&resizew=500" alt="{{text}}-banner1">
									</div>


							</ul>

						</li>
					</ul>
					{{/if}}
				</li>
			{{/if}}
		{{/each}}

	<!-- additionional top-level menu anchor for 'services' category. -->

		<li data-toggle="categories-menu" class="">
			<a class="header-menu-level1-anchor" href="#/services" data-hashtag="#/services" data-touchpoint="home">Services</a>
			<ul class="header-menu-level-container ">
				<li>
					<ul class="header-menu-level2">
						<div class="links-section">
							<li>
								<ul class="header-menu-level3">
									<li>
										<a class="header-menu-level3-anchor" href="/gas-solvents" data-hashtag="#/gas-solvents"
											data-touchpoint="home">Gas &amp; Solvents</a>
									</li>
									<li>
										<a class="header-menu-level3-anchor" href="/the-hybrid-creative" data-hashtag="#/the-hybrid-creative"
											data-touchpoint="home">The Hybrid Creative</a>
									</li>
									<li>
										<a class="header-menu-level3-anchor" href="/vape-support" data-hashtag="#/vape-support"
											data-touchpoint="home">Vaporizer Support</a>
									</li>
								</ul>
							</li>
						</div>
						{{!-- <div class="banner-section"><img class="header-menu-image" src="https://www.kushsupplyco.com/c.4516274/Images/Home/slider/slider1.jpg?resizeid=5&amp;resizeh=500&amp;resizew=500"
							 alt="Supplies-banner1"></div> --}}
					</ul>
				</li>
			</ul>
		</li>

	</ul>

</nav>




{{!----
Use the following context variables when customizing this template:

	categories (Array)
	showExtendedMenu (Boolean)
	showLanguages (Boolean)
	showCurrencies (Boolean)

----}}
