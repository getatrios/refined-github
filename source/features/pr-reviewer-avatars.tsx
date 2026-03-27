import './pr-reviewer-avatars.css';

import React from 'dom-chef';
import * as pageDetect from 'github-url-detection';
import CheckIcon from 'octicons-plain-react/Check';
import DotFillIcon from 'octicons-plain-react/DotFill';
import FileDiffIcon from 'octicons-plain-react/FileDiff';
import batchedFunction from 'batched-function';

import features from '../feature-manager.js';
import api from '../github-helpers/api.js';
import observe from '../helpers/selector-observer.js';
import {openPrsListLink} from '../github-helpers/selectors.js';
import {expectToken} from '../github-helpers/github-token.js';

const hiddenReviewers = new Set([
	'copilot-pull-request-reviewer',
]);

type ReviewNode = {
	author: {
		login: string;
		avatarUrl: string;
	};
	state: string;
};

type ReviewRequestNode = {
	requestedReviewer: {
		login: string;
		avatarUrl: string;
	};
};

function getStateLabel(state: string): string {
	switch (state) {
		case 'APPROVED': {
			return 'approved';
		}

		case 'CHANGES_REQUESTED': {
			return 'requested changes';
		}

		case 'COMMENTED': {
			return 'commented';
		}

		default: {
			return 'pending';
		}
	}
}

function getStateClass(state: string): string {
	switch (state) {
		case 'APPROVED': {
			return 'rgh-reviewer-approved';
		}

		case 'CHANGES_REQUESTED': {
			return 'rgh-reviewer-changes-requested';
		}

		default: {
			return 'rgh-reviewer-pending';
		}
	}
}

function getStatusBadge(state: string): JSX.Element {
	switch (state) {
		case 'APPROVED': {
			return <CheckIcon className="rgh-reviewer-badge rgh-reviewer-approved" />;
		}

		case 'CHANGES_REQUESTED': {
			return <FileDiffIcon className="rgh-reviewer-badge rgh-reviewer-changes-requested" />;
		}

		default: {
			return <DotFillIcon className="rgh-reviewer-badge rgh-reviewer-pending" />;
		}
	}
}

async function addReviewerAvatars(links: HTMLAnchorElement[]): Promise<void> {
	const prConfigs = links.map(link => {
		const [, owner, name, , prNumber] = link.pathname.split('/');
		const key = api.escapeKey(owner, name, prNumber);
		return {
			key,
			link,
			owner,
			name,
			number: Number(prNumber),
		};
	});

	const batchQuery = prConfigs.map(({key, owner, name, number}) => `
		${key}: repository(owner: "${owner}", name: "${name}") {
			pullRequest(number: ${number}) {
				latestReviews(first: 10) {
					nodes {
						author { login avatarUrl }
						state
					}
				}
				reviewRequests(first: 10) {
					nodes {
						requestedReviewer {
							... on User { login avatarUrl }
							... on Bot { login avatarUrl }
						}
					}
				}
			}
		}
	`).join('\n');

	const data = await api.v4(batchQuery);

	for (const pr of prConfigs) {
		const reviews: ReviewNode[] = data[pr.key].pullRequest.latestReviews.nodes;
		const reviewRequests: ReviewRequestNode[] = data[pr.key].pullRequest.reviewRequests.nodes;

		const visibleReviews: ReviewNode[] = reviews.filter(review =>
			review.state !== 'DISMISSED'
			&& !hiddenReviewers.has(review.author?.login),
		);

		// Add requested reviewers who haven't submitted a review yet
		const reviewedLogins = new Set(visibleReviews.map(r => r.author?.login));
		for (const request of reviewRequests) {
			const {requestedReviewer} = request;
			if (
				requestedReviewer?.login
				&& !reviewedLogins.has(requestedReviewer.login)
				&& !hiddenReviewers.has(requestedReviewer.login)
			) {
				visibleReviews.push({
					author: requestedReviewer,
					state: 'PENDING',
				});
			}
		}

		if (visibleReviews.length === 0) {
			continue;
		}

		const row = pr.link.closest('.js-issue-row');
		if (!row || row.querySelector('.rgh-pr-reviewer-avatars')) {
			continue;
		}

		const assigneeSection = row.querySelector('.AvatarStack')?.closest('span');
		if (!assigneeSection) {
			continue;
		}

		const avatarStrip = (
			<span className="rgh-pr-reviewer-avatars ml-2">
				{visibleReviews.map(review => (
					<a
						className={`rgh-reviewer-avatar ${getStateClass(review.state)} tooltipped tooltipped-n`}
						href={`/${review.author.login}`}
						aria-label={`${review.author.login} (${getStateLabel(review.state)})`}
					>
						<img
							src={review.author.avatarUrl}
							width="20"
							height="20"
							className="avatar avatar-user"
							alt={`@${review.author.login}`}
							loading="lazy"
						/>
						{getStatusBadge(review.state)}
					</a>
				))}
			</span>
		);

		assigneeSection.before(avatarStrip);
	}
}

async function init(signal: AbortSignal): Promise<void> {
	await expectToken();
	observe(openPrsListLink, batchedFunction(addReviewerAvatars, {delay: 100}), {signal});
}

void features.add(import.meta.url, {
	include: [
		pageDetect.isIssueOrPRList,
	],
	init,
});

/*

Test URLs:

https://github.com/refined-github/sandbox/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc+review
https://github.com/pulls

*/
