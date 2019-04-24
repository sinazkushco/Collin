<div class="additional-information-module">
	<h2 class="additional-information-title"> Additional Information </h2>
	<table class="additional-information-table">
		<tbody>
			{{#each additionalInformation}}
			{{#if display}}
			<tr>
				<td class="additional-info-table-data">
					{{label}}
				</td>
				<td class="additional-info-table-data">
					{{value}}
				</td>
			</tr>
			{{/if}}
			{{/each}}
		</tbody>
	</table>
</div>
