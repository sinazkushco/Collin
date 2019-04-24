<!--<div data-view="Global.BackToTop"></div>
<div class="footer-content">

	<div id="banner-footer" class="content-banner banner-footer" data-cms-area="global_banner_footer" data-cms-area-filters="global"></div>

	<div class="footer-content-nav">
		{{#if showFooterNavigationLinks}}
			<ul class="footer-content-nav-list">
				{{#each footerNavigationLinks}}
					<li>
						<a {{objectToAtrributes item}}>
							{{text}}
						</a>
					</li>
				{{/each}}
			</ul>
		{{/if}}
	</div>

	<div class="footer-content-right">
		<div data-view="FooterContent"></div>

		<div class="footer-content-copyright">
			{{translate '&copy; 2008-2015 Company Name'}}
		</div>
	</div>
</div>-->



<!-- Top Footer -->
<section class="top-footer">
	<div class="footer-content-right">
		<div data-cms-area="footer_content-newsletter-title" data-cms-area-filters="global"></div>
		{{!-- <div data-view="FooterContent"></div> --}}
	</div>
</section>

<div class="footer-content">

	<!-- Bottom Footer -->
	<section class="bottom-footer">
		<div class="row">
			<div class="footer-columns">
				<div data-cms-area="footer_content-nav-column-1" data-cms-area-filters="global"></div>
			</div>
			<div class="footer-columns">
				<div data-cms-area="footer_content-nav-column-2" data-cms-area-filters="global"></div>
			</div>
			<div class="footer-columns">
				<div data-cms-area="footer_content-nav-column-3" data-cms-area-filters="global"></div>
				<!--<div class="collapse" id="collapseMyAccount">
					<div class="well">
						<ul class="footer-nav">
							<li><a class="footer-nav-links" data-touchpoint="login" data-hashtag="login-register" href="#">{{translate 'SIGN IN'}}</a></li>
							<li><a class="footer-nav-links" href="#" data-touchpoint="customercenter" data-hashtag="#overview" name="accountoverview">{{translate 'MY ACCOUNT'}}</a></li>
							<li><a href="#" class="footer-nav-links" data-touchpoint="home" data-hashtag="#cart">{{translate 'VIEW CART'}}</a></li>
							<li><a class="footer-nav-links" data-touchpoint="register" data-hashtag="login-register" href="#">{{translate 'REGISTER'}}</a></li>
						</ul>
					</div>
				</div>-->
			</div>
			<div class="footer-columns">
				<div data-cms-area="footer_content-nav-column-4" data-cms-area-filters="global"></div>
			</div>
			<div class="footer-columns">
				<div data-cms-area="footer_content-nav-column-5" data-cms-area-filters="global"></div>
			</div>
		</div>
	</section>
	<div data-view="Global.BackToTop"></div>
</div>
<section class="bottom-section">
	<section class="bottom-footer container">
		<div class="left" data-cms-area="footer_content-bottom" data-cms-area-filters="global">
		</div>
		<p class="footer-copyright">Copyright &copy; {{currentYear}} Kush Supply Co, Inc. All Rights Reserved.
			<a href="/terms-and-conditions">Terms of Use</a> |
			<a href="/privacy-policy">Privacy Policy</a>
		</p>
	</section>
</section>




{{!----
Use the following context variables when customizing this template:

	showFooterNavigationLinks (Boolean)
	footerNavigationLinks (Array)

----}}
