"use client";

import { useEffect, useMemo, useState } from "react";

type Metric = {
	activePolicies: number;
	payoutsToday: number;
	fraudAlerts: number;
	avgPayoutTimeMin: number;
};

type RiderSnapshot = {
	protectedEarnings: number;
	disruptionEventsCompensated: number;
	latestPayoutAmount: number;
	latestPayoutTime: string;
	policyStatus: string;
	policyWindow: string;
};

type FraudAlert = {
	id: string;
	city: string;
	level: "high" | "medium" | "low";
	reason: string;
};

type TriggerEvent = {
	time: string;
	event: string;
	effect: string;
	status: string;
};

const fallbackMetrics: Metric = {
	activePolicies: 2842,
	payoutsToday: 196,
	fraudAlerts: 14,
	avgPayoutTimeMin: 3.8
};

const fallbackRider: RiderSnapshot = {
	protectedEarnings: 4800,
	disruptionEventsCompensated: 2,
	latestPayoutAmount: 1950,
	latestPayoutTime: "3m 12s",
	policyStatus: "Active",
	policyWindow: "Mon to Sun"
};

const plans = [
	{ name: "Basic", amount: 1500, basePremium: 25 },
	{ name: "Standard", amount: 3000, basePremium: 40 },
	{ name: "Plus", amount: 5000, basePremium: 55 }
] as const;

type Plan = (typeof plans)[number];

export default function HomePage() {
	const [view, setView] = useState<"rider" | "admin">("rider");
	const [metrics, setMetrics] = useState(fallbackMetrics);
	const [rider, setRider] = useState(fallbackRider);
	const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
	const [triggers, setTriggers] = useState<TriggerEvent[]>([]);
	const [dataState, setDataState] = useState<"ok" | "fallback">("ok");
	const [selectedPlan, setSelectedPlan] = useState<Plan>(plans[1]);
	const [locationRisk, setLocationRisk] = useState(0.7);
	const [weatherFactor, setWeatherFactor] = useState(0.65);
	const [incomeVariability, setIncomeVariability] = useState(0.5);
	const [reliabilityDiscount, setReliabilityDiscount] = useState(0.1);

	useEffect(() => {
		async function loadData() {
			try {
				const [riderRes, adminRes, triggerRes] = await Promise.all([
					fetch("/api/rider/summary", { cache: "no-store" }),
					fetch("/api/admin/overview", { cache: "no-store" }),
					fetch("/api/triggers", { cache: "no-store" })
				]);

				if (!riderRes.ok || !adminRes.ok || !triggerRes.ok) {
					setDataState("fallback");
					return;
				}

				const riderPayload = (await riderRes.json()) as {
					weeklyMetrics?: Metric;
					riderSnapshot?: RiderSnapshot;
				};

				const adminPayload = (await adminRes.json()) as {
					fraudAlerts?: FraudAlert[];
				};

				const triggerPayload = (await triggerRes.json()) as {
					triggerTimeline?: TriggerEvent[];
				};

				if (riderPayload.weeklyMetrics) {
					setMetrics(riderPayload.weeklyMetrics);
				}
				if (riderPayload.riderSnapshot) {
					setRider(riderPayload.riderSnapshot);
				}
				if (adminPayload.fraudAlerts) {
					setFraudAlerts(adminPayload.fraudAlerts);
				}
				if (triggerPayload.triggerTimeline) {
					setTriggers(triggerPayload.triggerTimeline);
				}

				setDataState("ok");
			} catch {
				setDataState("fallback");
			}
		}

		loadData();
	}, []);

	const premium = useMemo(() => {
		const weightedRisk = 0.4 * locationRisk + 0.35 * weatherFactor + 0.25 * incomeVariability;
		const raw = selectedPlan.basePremium * (1 + weightedRisk);
		return Math.max(12, Math.round(raw - raw * reliabilityDiscount));
	}, [incomeVariability, locationRisk, reliabilityDiscount, selectedPlan.basePremium, weatherFactor]);

	const riskScore = useMemo(() => {
		return Math.round(100 * (0.45 * locationRisk + 0.35 * weatherFactor + 0.2 * incomeVariability));
	}, [incomeVariability, locationRisk, weatherFactor]);

	function statusTone(level: string): string {
		if (level === "high" || level === "Verified") {
			return "pill danger";
		}

		if (level === "medium" || level === "Review") {
			return "pill warn";
		}

		return "pill safe";
	}

	return (
		<main className="shell">
			<section className="hero">
				<p className="badge">RideGuard Dashboard</p>
				<h1>Protecting every ride, every shift, every week.</h1>
				<p>
					A simple, mobile-friendly command center for weekly income protection, automatic triggers, and
					rapid payouts.
				</p>
				<div className="toggleRow">
					<button
						className={view === "rider" ? "toggle active" : "toggle"}
						onClick={() => setView("rider")}
						type="button"
					>
						Rider View
					</button>
					<button
						className={view === "admin" ? "toggle active" : "toggle"}
						onClick={() => setView("admin")}
						type="button"
					>
						Admin View
					</button>
				</div>
				{dataState === "fallback" && <p className="fallback">Using fallback data (backend not reachable).</p>}
			</section>

			<section className="metrics">
				<article>
					<h3>Active Policies</h3>
					<p>{metrics.activePolicies.toLocaleString()}</p>
				</article>
				<article>
					<h3>Payouts Today</h3>
					<p>{metrics.payoutsToday.toLocaleString()}</p>
				</article>
				<article>
					<h3>Fraud Alerts</h3>
					<p>{metrics.fraudAlerts}</p>
				</article>
				<article>
					<h3>Avg Payout Time</h3>
					<p>{metrics.avgPayoutTimeMin} min</p>
				</article>
			</section>

			<section className="grid">
				<article className="card">
					<h2>Weekly Premium Calculator</h2>
					<div className="plans">
						{plans.map((plan) => (
							<button
								className={selectedPlan.name === plan.name ? "plan active" : "plan"}
								key={plan.name}
								onClick={() => setSelectedPlan(plan)}
								type="button"
							>
								<strong>{plan.name}</strong>
								<span>INR {plan.amount.toLocaleString()}</span>
								<small>Base INR {plan.basePremium}/week</small>
							</button>
						))}
					</div>

					<label>
						Location Risk ({locationRisk.toFixed(2)})
						<input
							max={1}
							min={0}
							onChange={(e) => setLocationRisk(Number(e.target.value))}
							step={0.01}
							type="range"
							value={locationRisk}
						/>
					</label>
					<label>
						Weather Factor ({weatherFactor.toFixed(2)})
						<input
							max={1}
							min={0}
							onChange={(e) => setWeatherFactor(Number(e.target.value))}
							step={0.01}
							type="range"
							value={weatherFactor}
						/>
					</label>
					<label>
						Income Variability ({incomeVariability.toFixed(2)})
						<input
							max={1}
							min={0}
							onChange={(e) => setIncomeVariability(Number(e.target.value))}
							step={0.01}
							type="range"
							value={incomeVariability}
						/>
					</label>
					<label>
						Reliability Discount ({reliabilityDiscount.toFixed(2)})
						<input
							max={0.4}
							min={0}
							onChange={(e) => setReliabilityDiscount(Number(e.target.value))}
							step={0.01}
							type="range"
							value={reliabilityDiscount}
						/>
					</label>

					<div className="result">
						<div>
							<small>Suggested Premium</small>
							<p>INR {premium}/week</p>
						</div>
						<div>
							<small>Risk Score</small>
							<p>{riskScore}/100</p>
						</div>
					</div>
				</article>

				{view === "rider" ? (
					<article className="card">
						<h2>Rider Snapshot</h2>
						<ul className="snapshot">
							<li>
								<span>Protected Earnings</span>
								<strong>INR {rider.protectedEarnings.toLocaleString()}</strong>
							</li>
							<li>
								<span>Disruptions Compensated</span>
								<strong>{rider.disruptionEventsCompensated}</strong>
							</li>
							<li>
								<span>Latest Auto Payout</span>
								<strong>INR {rider.latestPayoutAmount.toLocaleString()}</strong>
							</li>
							<li>
								<span>Payout Processing Time</span>
								<strong>{rider.latestPayoutTime}</strong>
							</li>
							<li>
								<span>Policy Status</span>
								<strong>{rider.policyStatus}</strong>
							</li>
							<li>
								<span>Coverage Window</span>
								<strong>{rider.policyWindow}</strong>
							</li>
						</ul>
					</article>
				) : (
					<article className="card">
						<h2>Fraud Alert Queue</h2>
						<div className="alerts">
							{fraudAlerts.length === 0 ? (
								<p className="empty">No active fraud alerts.</p>
							) : (
								fraudAlerts.map((alert) => (
									<div className="alertRow" key={alert.id}>
										<div>
											<strong>{alert.id}</strong>
											<p>
												{alert.city} - {alert.reason}
											</p>
										</div>
										<span className={statusTone(alert.level)}>{alert.level}</span>
									</div>
								))
							)}
						</div>
					</article>
				)}
			</section>

			<section className="card timelineCard">
				<h2>Parametric Trigger Timeline</h2>
				<div className="timeline">
					{triggers.length === 0 ? (
						<p className="empty">No trigger events yet.</p>
					) : (
						triggers.slice(-6).reverse().map((item, idx) => (
							<div className="timelineRow" key={`${item.time}-${item.event}-${idx}`}>
								<span>{item.time}</span>
								<strong>{item.event}</strong>
								<p>{item.effect}</p>
								<em className={statusTone(item.status)}>{item.status}</em>
							</div>
						))
					)}
				</div>
			</section>
		</main>
	);
}
