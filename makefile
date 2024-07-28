# Makefile for setting up the environment on RHEL systems
# This Makefile has been tested and validated on RHEL 9.

.PHONY: all update git nodejs disable_selinux awscli-pip docker docker-compose

all: update git nodejs disable_selinux awscli-pip docker docker-compose

update:
	@if grep -q 'VERSION_ID="9"' /etc/os-release; then \
		sudo dnf update -y; \
	else \
		sudo yum update -y; \
	fi

git:
	@if grep -q 'VERSION_ID="9"' /etc/os-release; then \
		sudo dnf install -y git; \
	else \
		sudo yum install -y git; \
	fi

nodejs:
	@if grep -q 'VERSION_ID="9"' /etc/os-release; then \
		sudo dnf module enable -y nodejs:18; \
		sudo dnf install -y nodejs; \
	else \
		sudo yum module enable -y nodejs:18; \
		sudo yum install -y nodejs; \
	fi

disable_selinux:
	getenforce
	sudo sed -i 's/^SELINUX=.*/SELINUX=disabled/' /etc/selinux/config
	sudo setenforce 0

awscli-pip:
	# Install pip and awscli
	@if grep -q 'VERSION_ID="9"' /etc/os-release; then \
		sudo dnf install -y python3-pip; \
	else \
		sudo yum install -y python3-pip; \
	fi
	pip3 install awscli
	export PATH=$$PATH:/usr/local/bin

	# Make PATH change persistent
	echo 'export PATH=$$PATH:/usr/local/bin' >> ~/.bashrc
	source ~/.bashrc

docker:
	@if grep -q 'VERSION_ID="9"' /etc/os-release; then \
		sudo dnf install -y vim; \
		sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo; \
		sudo dnf install -y docker-ce docker-ce-cli containerd.io; \
	else \
		sudo yum install -y vim; \
		sudo yum config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo; \
		sudo yum install -y docker-ce docker-ce-cli containerd.io; \
	fi

	# Enable and start Docker service
	sudo systemctl start docker
	sudo systemctl enable docker

	# Add current user to Docker group
	# sudo usermod -aG docker $$USER
	# newgrp docker
	docker --version

docker-compose:
	# Install Docker Compose
	sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$$(uname -s)-$$(uname -m)" -o /usr/local/bin/docker-compose
	sudo chmod +x /usr/local/bin/docker-compose
	docker-compose --version

