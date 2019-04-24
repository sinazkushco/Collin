<div class="header-sidebar-wrapper">
	<div class="header-sidebar-profile-menu" data-view="Header.Profile"></div>

	<div class="header-sidebar-menu-wrapper" data-type="header-sidebar-menu">

		<ul class="header-sidebar-menu">
			{{#each categories}}
				{{#if text}}
					<li>
						<a {{objectToAtrributes this}} {{#if categories}}data-action="push-menu"{{/if}} name="{{text}}">
							{{text}}
							{{#if categories}}<i class="header-sidebar-menu-push-icon"></i>{{/if}}
						</a>
						{{#if categories}}
							<ul>
								<li>
									<a href="#" class="header-sidebar-menu-back" data-action="pop-menu" name="back-sidebar">
										<i class="header-sidebar-menu-pop-icon"></i>
										{{translate 'Back'}}
									</a>
								</li>

								<li>
									<a {{objectToAtrributes this}}>
										{{translate 'Browse $(0)' text}}
									</a>
								</li>

								{{#each categories}}
								<li>
									<a {{objectToAtrributes this}} {{#if categories}}data-action="push-menu"{{/if}}>
									{{text}}
									{{#if categories}}<i class="header-sidebar-menu-push-icon"></i>{{/if}}
									</a>

									{{#if categories}}
									<ul>
										<li>
											<a href="#" class="header-sidebar-menu-back" data-action="pop-menu">
												<i class="header-sidebar-menu-pop-icon"></i>
												{{translate 'Back'}}
											</a>
										</li>

										<li>
											<a {{objectToAtrributes this}}>
												{{translate 'Browse $(0)' text}}
											</a>
										</li>

										{{#each categories}}
										<li>
											<a {{objectToAtrributes this}} name="{{text}}">{{text}}</a>
										</li>
										{{/each}}
									</ul>
									{{/if}}
								</li>
								{{/each}}
							</ul>
						{{/if}}
					</li>
				{{/if}}
			{{/each}}


{{!-- This section for custom services landing page and menu --}}
					<li><a href="/services" data-hashtag="#/services" data-touchpoint="home" data-action="push-menu" name="Services">
							Services <i class="header-sidebar-menu-push-icon"></i></a>
						<ul>
							<li><a href="#" class="header-sidebar-menu-back" data-action="pop-menu" name="back-sidebar"><i class="header-sidebar-menu-pop-icon"></i>
									Back </a></li>
							<li><a href="/services" data-hashtag="#/services" data-touchpoint="home"> Browse Services </a></li>
							<li><a href="/gas-solvents" data-hashtag="#/gas-solvents" data-touchpoint="home">Gas & Solvents</a></li>
							<li><a href="/the-hybrid-creative" data-hashtag="#/the-hybrid-creative" data-touchpoint="home">The Hybrid Creative</a></li>
							<li><a href="/vape-support" data-hashtag="#/vape-support" data-touchpoint="home">Vape Support</a>
							</li>
						</ul>
					</li>
{{!-- End of services area --}}


			{{#if showExtendedMenu}}
				<li class="header-sidebar-menu-myaccount" data-view="Header.Menu.MyAccount"></li>
			{{/if}}
			<li data-view="QuickOrderHeaderLink"></li>
			<li data-view="RequestQuoteWizardHeaderLink"></li>
		</ul>

	</div>

	{{#if showExtendedMenu}}
	<a class="header-sidebar-user-logout" href="#" data-touchpoint="logout" name="logout">
		<i class="header-sidebar-user-logout-icon"></i>
		{{translate 'Sign Out'}}
	</a>
	{{/if}}

	{{#if showLanguages}}
	<div data-view="Global.HostSelector"></div>
	{{/if}}
	{{#if showCurrencies}}
	<div data-view="Global.CurrencySelector"></div>
	{{/if}}

</div>



{{!----
Use the following context variables when customizing this template:

	categories (Array)
	showExtendedMenu (Boolean)
	showLanguages (Boolean)
	showCurrencies (Boolean)

----}}
