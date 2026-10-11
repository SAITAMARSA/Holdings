<?php
/**
 * Home: frequently asked questions.
 *
 * @package GreenHomeStore
 */

$ghstore_faqs = array(
	array( __( 'How much can I save on my electricity bill?', 'green-home-store' ), __( 'Most homeowners save between 60-80% on their monthly electricity bills with a solar system. The exact amount depends on your current consumption, location, and the package size. Contact us for a personalized assessment.', 'green-home-store' ) ),
	array( __( 'How long does installation take?', 'green-home-store' ), __( 'A typical residential installation takes 2-3 days from start to finish. The timeline depends on system size and roof complexity. We’ll provide a detailed schedule when you request your quote.', 'green-home-store' ) ),
	array( __( 'Do solar panels work during cloudy weather?', 'green-home-store' ), __( 'Yes, solar panels still generate electricity on cloudy days, though at reduced capacity (about 25% of normal output). Modern systems with battery storage ensure you have power even when generation is low.', 'green-home-store' ) ),
	array( __( 'What warranty do you provide?', 'green-home-store' ), __( 'We offer 5-15 years warranty depending on your package. Solar panels typically last 25+ years. Inverters and batteries have separate warranties. All details are included in your quote.', 'green-home-store' ) ),
	array( __( 'Do you offer financing options?', 'green-home-store' ), __( 'Yes! We offer flexible financing options to make solar more affordable. Monthly payments can often be lower than your current electricity bill, so you save money from day one.', 'green-home-store' ) ),
	array( __( 'What about maintenance?', 'green-home-store' ), __( 'Solar systems require minimal maintenance. Occasional cleaning and annual inspections are recommended. We offer maintenance packages to keep your system running optimally.', 'green-home-store' ) ),
);
?>
<section class="section section-alt" id="faq">
	<div class="wrap wrap-narrow">
		<?php
		ghstore_section_head(
			__( 'FAQ', 'green-home-store' ),
			__( 'Frequently Asked Questions', 'green-home-store' ),
			__( 'Find answers to common questions about our solar solutions.', 'green-home-store' )
		);
		?>
		<div class="faq-list">
			<?php foreach ( $ghstore_faqs as $ghstore_i => $ghstore_faq ) : ?>
				<details class="faq-item"<?php echo 0 === $ghstore_i ? ' open' : ''; ?>>
					<summary><?php echo esc_html( $ghstore_faq[0] ); ?></summary>
					<p><?php echo esc_html( $ghstore_faq[1] ); ?></p>
				</details>
			<?php endforeach; ?>
		</div>
	</div>
</section>
